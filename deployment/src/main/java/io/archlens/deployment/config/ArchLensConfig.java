package io.archlens.deployment.config;

import io.quarkus.runtime.annotations.ConfigPhase;
import io.quarkus.runtime.annotations.ConfigRoot;
import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

@ConfigRoot(phase = ConfigPhase.BUILD_TIME)
@ConfigMapping(prefix = "archlens")
public interface ArchLensConfig {

    /**
     * Path to the archlens YAML configuration file.
     * Override via {@code archlens.config-path=my-arch.yaml} in application.properties
     * or {@code ARCHLENS_CONFIG_PATH} environment variable.
     */
    @WithDefault("archlens.yaml")
    String configPath();

    /**
     * When {@code true}, the build fails if any architectural violations are detected.
     * Override via {@code archlens.fail-on-violation=true} in application.properties
     * or {@code ARCHLENS_FAIL_ON_VIOLATION=true} environment variable.
     */
    @WithDefault("false")
    boolean failOnViolation();
}
