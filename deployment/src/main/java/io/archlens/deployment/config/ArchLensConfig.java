package io.archlens.deployment.config;

import io.quarkus.runtime.annotations.ConfigPhase;
import io.quarkus.runtime.annotations.ConfigRoot;
import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

@ConfigRoot(phase = ConfigPhase.BUILD_TIME)
@ConfigMapping(prefix = "archlens")
public interface ArchLensConfig {

    /**
     * Path to the configuration file.
     * use like archlens.configFile=archlens-config.yaml
     */
    @WithDefault("archlens.yaml")
    String configPath();
}