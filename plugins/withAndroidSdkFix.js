const { withProjectBuildGradle } = require('expo/config-plugins');

module.exports = function withAndroidSdkFix(config) {
    return withProjectBuildGradle(config, (config) => {

        // We write the helper function in Groovy, not JS!
        const gradleFix = `
// --- FIX FOR REACT-NATIVE-BLE-ADVERTISER ---
subprojects { subproject ->
    if (subproject.name == "app" || subproject == rootProject) return;

    // Define the helper closure in Groovy
    def safeGetVersion = { val ->
        try {
            if (val instanceof Integer) return val
            if (val == null) return 0
            def s = val.toString().replace("android-", "")
            return s.toInteger()
        } catch (e) { return 0 }
    }

    subproject.afterEvaluate { project ->
        if (project.hasProperty("android")) {
            try {
                // Force compileSdkVersion to 35
                def currentCompile = safeGetVersion(project.android.compileSdkVersion)
                if (currentCompile < 35) {
                    project.android.compileSdkVersion = 35
                }
                
                // Force buildToolsVersion
                project.android.buildToolsVersion = "35.0.0"
                
                // Fix targetSdkVersion if present
                if (project.android.hasProperty("defaultConfig") && project.android.defaultConfig.targetSdkVersion != null) {
                    def currentTarget = safeGetVersion(project.android.defaultConfig.targetSdkVersion.apiLevel)
                    if (currentTarget < 35) {
                        project.android.defaultConfig.targetSdkVersion(35)
                    }
                }
            } catch (e) {
                println "Skipped fixing \${project.name}: \${e.message}"
            }
        }
    }
}
// -------------------------------------------
`;

        // Prevent duplicate appends
        if (!config.modResults.contents.includes('FIX FOR REACT-NATIVE-BLE-ADVERTISER')) {
            config.modResults.contents += gradleFix;
        }
        return config;
    });
};