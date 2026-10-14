import os
import zipfile
import subprocess
import pytest

SERVER_APK = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "apps", "android", "paw-release-signed.apk")
STANDALONE_APK = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "apps", "android_standalone", "paw-standalone-signed.apk")
APKSIGNER = r"C:\Users\AGulbr\AppData\Local\Android\Sdk\build-tools\35.0.0\apksigner.bat"

@pytest.mark.parametrize("apk_path, name", [
    (SERVER_APK, "Server TWA"),
    (STANDALONE_APK, "Standalone Mobile")
])
def test_signed_apk_exists_and_valid_size(apk_path, name):
    assert os.path.exists(apk_path), f"Signed APK for {name} not found at {apk_path}"
    size = os.path.getsize(apk_path)
    assert 500_000 < size < 10_000_000, f"Unexpected APK size for {name}: {size} bytes"

@pytest.mark.parametrize("apk_path", [SERVER_APK, STANDALONE_APK])
def test_apk_contains_essential_android_components(apk_path):
    assert zipfile.is_zipfile(apk_path)
    with zipfile.ZipFile(apk_path, "r") as z:
        names = z.namelist()
        assert "AndroidManifest.xml" in names
        assert "classes.dex" in names
        assert "resources.arsc" in names
        signatures = [n for n in names if n.startswith("META-INF/")]
        assert len(signatures) > 0, "No signature metadata found in APK"

@pytest.mark.parametrize("apk_path", [SERVER_APK, STANDALONE_APK])
def test_apk_signature_scheme_verification(apk_path):
    if not os.path.exists(APKSIGNER):
        pytest.skip("apksigner tool not found on host")

    cmd = f'"{APKSIGNER}" verify --verbose "{apk_path}"'
    res = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    assert res.returncode == 0, f"APK verification failed: {res.stderr}"
    assert "Verified using v2 scheme (APK Signature Scheme v2): true" in res.stdout
    assert "Verified using v3 scheme (APK Signature Scheme v3): true" in res.stdout

def test_adb_device_installed_packages():
    """Verify that packages are installed on the connected physical test phone via ADB if attached."""
    cmd = 'adb devices'
    res = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    if "device" not in res.stdout or "RFCY113MZZR" not in res.stdout:
        pytest.skip("Physical test device not attached via USB")

    check_cmd = 'adb shell "pm list packages | grep personalai"'
    check_res = subprocess.run(check_cmd, capture_output=True, text=True, shell=True)
    assert "com.personalai.workspace" in check_res.stdout
    assert "com.personalai.standalone" in check_res.stdout
