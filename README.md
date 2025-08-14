## Prerequisites and Setup

### Using Nix

Using Nix ensures that all developers have the exact same development environment, eliminating "it works on my machine" problems.

#### Setup Steps

1. Install Nix:

```bash
# For macOS and Linux
sh <(curl -L https://nixos.org/nix/install) --daemon

# For more installation options, visit:
# https://nixos.org/download.html
```

2. Enable Flakes (if not already enabled):

```bash
# Add this to ~/.config/nix/nix.conf or /etc/nix/nix.conf
experimental-features = nix-command flakes
```

To enter a Nix shell session with dependencies defined in a flake, you primarily use the `nix develop` command.

- **Navigate to the flake's directory:** Open your terminal and change your current directory to the root of the Nix flake project where the `flake.nix` file resides.
- **Enter the development shell:** Execute the following command:

```bash
# From the project root
nix develop --command "$SHELL"
```

## Development
