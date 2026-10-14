import os
import zipfile
import subprocess
import pytest

APK_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "apps", "android", "paw-release-signed.apk")
APKSIGNER = r"C:\Users\AGulbr\AppData\Local\Android\Sdk\build-tools\35.0.0\apksigner.bat"

def test_signed_apk_exists_and_valid_size():
    assert os.path.exists(APK_PATH), f"Signed APK not found at {APK_PATH}"
    size = os.path.getsize(APK_PATH)
    # TWA release APK should be around 1 MB
    assert 500_000 < size < 10_000_000, f"Unexpected APK size: {size} bytes"

def test_apk_contains_essential_android_components():
    assert zipfile.is_zipfile(APK_PATH)
    with zipfile.ZipFile(APK_PATH, "r") as z:
        names = z.namelist()
        assert "AndroidManifest.xml" in names
        assert "classes.dex" in names
        assert "resources.arsc" in names
        # Check META-INF signatures
        signatures = [n for n in names if n.startswith("META-INF/")]
        assert len(signatures) > 0, "No signature metadata found in APK"

def test_apk_signature_scheme_verification():
    if not os.path.exists(APKSIGNER):
        pytest.skip("apksigner tool not found on host")
    
    cmd = f'"{APKSIGNER}" verify --verbose "{APK_PATH}"'
    res = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    assert res.returncode == 0, f"APK verification failed: {res.stderr}"
    assert "Verified using v2 scheme (APK Signature Scheme v2): true" in res.stdout
    assert "Verified using v3 scheme (APK Signature Scheme v3): true" in res.stdout
