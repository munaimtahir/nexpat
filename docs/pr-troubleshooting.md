# PR Creation: "Binary file not supported" Message

When GitHub attempts to display a diff for files that it detects as binary, it shows a grey banner that reads **"Binary file not shown."** The pull request can still be created; the message simply indicates that the web diff viewer will not render the file's contents inline.

In this repository, files such as the Gradle wrapper script (`gradlew`) and the wrapper JAR (`gradle/wrapper/gradle-wrapper.jar`, if present) are treated as binary by GitHub, so their diffs trigger that notice during PR creation.

If you encounter this message while reviewing or creating a PR, proceed with the submission. To inspect the binary file locally, check it out with Git and open it using the appropriate tooling instead of relying on the GitHub diff viewer.
