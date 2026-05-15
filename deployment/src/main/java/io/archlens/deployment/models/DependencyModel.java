package io.archlens.deployment.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Represents a detected dependency between two classes (via CDI @Inject).
 * Resolved to layer/subsystem coordinates so the UI can draw edges on the graph.
 */
@Getter
@Setter
@NoArgsConstructor
public class DependencyModel {

    private String fromClass;
    private String toClass;
    private String fromLayer;
    private String fromSubsystem;
    private String toLayer;
    private String toSubsystem;
    private boolean violation;

    public DependencyModel( // I am not using @AllAergsConstructor here because parameter reordering may happen
            String fromClass,
            String toClass,
            String fromLayer,
            String fromSubsystem,
            String toLayer,
            String toSubsystem
    ) {
        this.fromClass = fromClass;
        this.toClass = toClass;
        this.fromLayer = fromLayer;
        this.fromSubsystem = fromSubsystem;
        this.toLayer = toLayer;
        this.toSubsystem = toSubsystem;
    }
}
