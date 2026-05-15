# ArchLens

**Interactive architecture documentation in the Quarkus Dev UI.**

ArchLens reads your `archlens.yaml`, scans your codebase at build time using Jandex, and renders an interactive
module/layer graph — directly inside the Quarkus Dev UI. Zero runtime overhead.

---

## What it does

- **Interactive graph** of your application modules and layers (Cytoscape.js)
- **Auto-discovery** of classes into layers by annotations and package patterns
- ️**Manual override** via `@ArchComponent` annotation for edge-case classes
- **Build-time only** — nothing runs in production
- **Layer rules** displayed per layer so developers know where logic belongs

---

## Project Structure

TODO: add structure

---

## Quick Start

### 1. Build and install locally

```bash
mvn clean install -DskipTests
```

### 2. Add to your Quarkus project

```xml

<dependency>
    <groupId>io.archlens</groupId>
    <artifactId>archlens</artifactId>
    <version>1.0.1-SNAPSHOT</version>
</dependency>
```

### 3. Create `archlens.yaml` at your project root

### 4. Run in dev mode

```bash
mvnw quarkus:dev
```

Open `http://localhost:8080/q/dev-ui` and click the **ArchLens** card.

---

## @ArchComponent Annotation

Override auto-discovery for any class:

```java

@ArchComponent(
        layer = "Service",
        module = "HTTP API",
        description = "Handles user authentication and token management"
)
@ApplicationScoped
public class AuthService { ...
}
```

The annotation has `CLASS` retention so Jandex can read it at build time. It is never loaded by the JVM at runtime.

