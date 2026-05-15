package io.archlens.deployment;

import io.archlens.deployment.builditem.ArchitectureModelBuildItem;
import io.archlens.deployment.config.ArchLensConfig;
import io.archlens.deployment.config.ArchLensConfigReader;
import io.archlens.deployment.config.ArchLensYamlConfig;
import io.archlens.deployment.config.ConfigPathResolver;
import io.archlens.deployment.discovery.ComponentResolver;
import io.archlens.deployment.discovery.DependencyAnalyzer;
import io.archlens.deployment.models.ArchitectureModel;
import io.quarkus.deployment.annotations.BuildProducer;
import io.quarkus.deployment.annotations.BuildStep;
import io.quarkus.deployment.builditem.ApplicationIndexBuildItem;
import io.quarkus.deployment.builditem.FeatureBuildItem;
import java.io.IOException;
import java.nio.file.Path;
import lombok.extern.slf4j.Slf4j;

/**
 * Main ArchLens build processor.
 */
@Slf4j
public class ArchLensProcessor {

    private static final String FEATURE = "archlens";

    ArchLensConfig config;

    @BuildStep
    FeatureBuildItem feature() {
        return new FeatureBuildItem(FEATURE);
    }

    /**
     * Main build step that constructs the architecture model.
     */
    @BuildStep
    void buildArchitectureModel(
            ApplicationIndexBuildItem applicationIndex,
            BuildProducer<ArchitectureModelBuildItem> modelProducer) {

        ArchitectureModel model;

        Path configPath = ConfigPathResolver.resolveConfigPath(config.configPath());

        if (configPath == null) {
            log.warn("""
                    ArchLens: no archlens.yaml found. Searched current directory and parent.
                    Create archlens.yaml at your project root to get started.
                    """
            );
            model = new ArchitectureModel();
        } else {
            try {
                ArchLensYamlConfig config = ArchLensConfigReader.read(configPath);

                model = ComponentResolver.scan(applicationIndex.getIndex(), config);
                DependencyAnalyzer.analyze(applicationIndex.getIndex(), model);

            } catch (IOException e) {
                log.error("ArchLens: failed to read {} — showing empty model in Dev UI", configPath, e);
                model = new ArchitectureModel();
            } catch (IllegalStateException e) {
                throw new RuntimeException(
                        "ArchLens configuration error: " + e.getMessage(), e);
            }
        }

        modelProducer.produce(new ArchitectureModelBuildItem(model));
    }
}
