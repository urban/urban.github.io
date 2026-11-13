#!/bin/bash

direnv allow
pnpm install

if [ -d .repos/effect ]; then
  git -C .repos/effect pull --ff-only
else
  git clone https://github.com/effect-ts/effect-smol.git --depth 1 .repos/effect
fi
