{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  };
  outputs =
    { nixpkgs, ... }:
    let
      forAllSystems =
        function:
        nixpkgs.lib.genAttrs nixpkgs.lib.systems.flakeExposed (
          system: function nixpkgs.legacyPackages.${system}
        );
    in
    {
      formatter = forAllSystems (pkgs: pkgs.alejandra);
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = with pkgs; [
            bun
            corepack
            nodejs_24
            git
          ];

          shellHook = ''
            export NPM_CONFIG_PREFIX="$HOME/.npm-global"
            export PATH="$NPM_CONFIG_PREFIX/bin:$PATH"
            mkdir -p "$NPM_CONFIG_PREFIX/bin"

            echo "Node: $(node --version)"
            echo "Bun: $(bun --version)"
            echo "Git: $(git --version)"
            echo ""
          '';
        };
      });
    };
}
