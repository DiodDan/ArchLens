package io.archlens.deployment.config;

import java.nio.file.Path;
import java.nio.file.Paths;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ConfigPathResolver {

    /**
     * Resolves the path to {@code archlens.yaml}.
     */
    public static Path resolveConfigPath(String configFile) {
        Path cwd = Paths.get(System.getProperty("user.dir", "."));

        Path inCwd = cwd.resolve(configFile);
        Path inParent = cwd.getParent() != null ? cwd.getParent().resolve(configFile) : null;

        if (inCwd.toFile().exists()) {
            log.info("ArchLens: found config at {}", inCwd.toAbsolutePath());
            return inCwd;
        }
        if (inParent != null && inParent.toFile().exists()) {
            log.info("ArchLens: found config at {}", inParent.toAbsolutePath());
            return inParent;
        }
        return null;
    }
}
