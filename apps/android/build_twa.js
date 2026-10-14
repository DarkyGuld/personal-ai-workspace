const fs = require('fs');
const path = require('path');
const http = require('http');
const {
    TwaGenerator,
    TwaManifest,
    AndroidSdkTools,
    JdkHelper,
    GradleWrapper,
    Config
} = require('@bubblewrap/core');

async function main() {
    console.log('--- Starting Personal AI Workspace Android TWA Build ---');
    const projectDir = path.resolve(__dirname);
    const webDistIcons = path.resolve(__dirname, '../web/dist/icons');

    // 1. Host local icon server for Bubblewrap icon fetching
    const server = http.createServer((req, res) => {
        const reqFile = req.url.replace(/^\//, '');
        const filePath = path.join(webDistIcons, reqFile);
        if (fs.existsSync(filePath)) {
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(fs.readFileSync(filePath));
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    });

    await new Promise((resolve) => server.listen(39123, '127.0.0.1', resolve));
    console.log('Local icon server listening on port 39123.');

    try {
        const manifestData = {
            packageId: 'com.personalai.workspace',
            host: 'localhost:3000',
            name: 'Personal AI Workspace',
            launcherName: 'PAW',
            display: 'standalone',
            themeColor: '#0f172a',
            navigationColor: '#0f172a',
            backgroundColor: '#0f172a',
            startUrl: '/',
            iconUrl: 'http://127.0.0.1:39123/icon-512.png',
            maskableIconUrl: 'http://127.0.0.1:39123/maskable_icon.png',
            appVersion: '1.0.0',
            appVersionCode: 1,
            signingKey: { path: './paw-test.keystore', alias: 'paw' },
            enableNotifications: true,
            generatorApp: 'bubblewrap'
        };

        const manifest = new TwaManifest(manifestData);
        fs.writeFileSync(path.join(projectDir, 'twa-manifest.json'), JSON.stringify(manifest.toJson(), null, 2));
        console.log('Saved twa-manifest.json.');

        // 2. Generate TWA Gradle Project
        const generator = new TwaGenerator();
        console.log('Generating Android Gradle project structure...');
        await generator.createTwaProject(projectDir, manifest);
        console.log('Android project generated successfully.');

        // 3. Initialize Android tools and Gradle Wrapper
        const config = new Config(
            'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.20.101-hotspot',
            'C:\\Users\\AGulbr\\AppData\\Local\\Android\\Sdk'
        );
        const jdkHelper = new JdkHelper(process, config);
        const androidSdkTools = await AndroidSdkTools.create(process, config, jdkHelper);
        const gradleWrapper = new GradleWrapper(process, androidSdkTools, projectDir);

        console.log('Building release APK via Gradle assembleRelease...');
        await gradleWrapper.assembleRelease();
        console.log('assembleRelease completed successfully.');

        // 4. Align and Sign APK
        const unsignedApk = path.join(projectDir, 'app/build/outputs/apk/release/app-release-unsigned.apk');
        const alignedApk = path.join(projectDir, 'app-release-unsigned-aligned.apk');
        const signedApk = path.join(projectDir, 'paw-release-signed.apk');

        if (!fs.existsSync(unsignedApk)) {
            throw new Error(`Expected unsigned APK not found at ${unsignedApk}`);
        }

        console.log('Zipaligning APK...');
        await androidSdkTools.zipalign(unsignedApk, alignedApk);

        console.log('Signing APK with paw-test.keystore...');
        const keystorePath = path.join(projectDir, 'paw-test.keystore');
        await androidSdkTools.apksigner(
            keystorePath,
            'pawandroid',
            'paw',
            'pawandroid',
            alignedApk,
            signedApk
        );

        console.log('SUCCESS! Verified Signed Android APK generated at:', signedApk);
        const stats = fs.statSync(signedApk);
        console.log(`APK Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);

    } finally {
        server.close();
        console.log('Icon server closed.');
    }
}

main().catch((err) => {
    console.error('Build failed with error:', err);
    process.exit(1);
});
