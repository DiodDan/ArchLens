package io.archlens.deployment.builditem;

import io.archlens.deployment.models.ArchitectureModel;
import io.quarkus.builder.item.SimpleBuildItem;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Build item that carries the fully-resolved {@link ArchitectureModel} from the
 * scanning/analysis build step to the Dev UI registration build step.
 */
@Getter
@AllArgsConstructor
public final class ArchitectureModelBuildItem extends SimpleBuildItem {
    private final ArchitectureModel model;
}
