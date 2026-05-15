package io.archlens.deployment.models.enums;

import lombok.ToString;

@ToString
public enum ComponentSource {
    PACKAGE,
    ANNOTATION,
    UNCLASSIFIED,
    MANUAL;
}
