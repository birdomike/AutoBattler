# Status Effect Icons

This directory holds icons for all status effects in the game. Icons should be created as 32x32 PNG files with transparent backgrounds.

## Required Icons

For each status effect in `data/status_effects.json`, an icon should be created with the same name as its ID:

1. `burn.png` - Red flame icon for the Burn status effect
2. `poison.png` - Green droplet or skull icon for the Poison status effect
3. `regen.png` - Green heart or plus icon for the Regeneration status effect
4. `stun.png` - Yellow stars or lightning bolt for the Stunned status effect
5. `freeze.png` - Blue snowflake icon for the Frozen status effect
6. `shield.png` - Gray/blue shield icon for the Shield status effect
7. `atk_up.png` - Red upward arrow for Attack Up status effect
8. `atk_down.png` - Red downward arrow for Attack Down status effect 
9. `def_up.png` - Blue upward arrow for Defense Up status effect
10. `def_down.png` - Blue downward arrow for Defense Down status effect
11. `spd_up.png` - Yellow upward arrow for Speed Up status effect
12. `spd_down.png` - Yellow downward arrow for Speed Down status effect
13. `str_up.png` - Orange upward arrow for Strength Up status effect
14. `str_down.png` - Orange downward arrow for Strength Down status effect
15. `int_up.png` - Purple upward arrow for Intellect Up status effect
16. `int_down.png` - Purple downward arrow for Intellect Down status effect
17. `spi_up.png` - Green upward arrow for Spirit Up status effect
18. `spi_down.png` - Green downward arrow for Spirit Down status effect
19. `taunt.png` - Red exclamation mark for Taunt status effect
20. `evade.png` - Misty/ghostly icon for Evasion status effect
21. `bleed.png` - Red droplet icon for Bleeding status effect
22. `reflect.png` - Mirror/bouncing icon for Damage Reflect status effect
23. `vulnerable.png` - Broken shield icon for Vulnerable status effect
24. `immune.png` - Shield with star for Immunity status effect
25. `crit_up.png` - Target/bullseye icon for Critical Boost status effect

## Icon Naming

Ensure that icon filenames match the status effect IDs, but without the `status_` prefix.

For example:
- The icon for `status_burn` should be named `burn.png`
- The icon for `status_def_up` should be named `def_up.png`

## Style Guidelines

1. **Size**: All icons should be 32x32 pixels
2. **Format**: PNG with transparency
3. **Style**: Simple, bold designs that are recognizable at small sizes
4. **Colors**: Use consistent colors across related effects (e.g., all "up" effects use same arrow style)
5. **Outlines**: Consider adding dark outlines for better visibility against light backgrounds

## How to Generate Icons

You can create these icons using:
1. A pixel art tool (like Aseprite)
2. An image editor (like Photoshop or GIMP)
3. AI image generation (with proper sizing and formatting)
4. Use free game icons from sources like Game-icons.net (with proper attribution)

Remember to keep the designs simple and clearly distinguishable at small sizes!
