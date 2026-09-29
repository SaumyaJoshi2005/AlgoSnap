# Privacy

AlgoSnap runs locally in the VS Code extension host. It reads only the active
document's bounded prefix for name suggestions. It does not send source code,
file names, identifiers, or usage events to any service. It has no telemetry,
analytics, authentication, remote configuration, or runtime network client.

The output channel records an error category when an operation fails; source
contents and paths are not logged. Reports you submit to GitHub are public;
include a minimal reproducible example instead of private source.

Marketplace installation and update behavior is controlled by VS Code, separately
from this extension. Development tools can download npm packages and test builds.
