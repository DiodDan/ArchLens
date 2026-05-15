package io.archlens.deployment.models;

import lombok.Getter;
import lombok.Setter;

/**
 * Represents an architectural rule violation: a dependency between layers that
 * is not permitted by the rules defined in {@code archlens.yaml}.
 */
@Getter
@Setter
public class ViolationModel {

    private String fromClass;
    private String toClass;
    private String fromLayer;
    private String fromSubsystem;
    private String toLayer;
    private String toSubsystem;
    private String violatedRule;
}
