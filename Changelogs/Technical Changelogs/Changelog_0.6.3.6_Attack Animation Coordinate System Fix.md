# Changelog: Attack Animation Coordinate System Fix

## Version: 0.6.3.6

## Problem
Characters would sometimes visually appear to attack allies instead of enemies during battle, despite the battle logs correctly indicating they were targeting enemies. For example, Drakarion (Player) would animate towards Aqualia (Player) even though logs showed the target was Lumina (Enemy).

## Root Cause Analysis
The issue was identified in `CharacterSprite.showAttackAnimation()` where the animation calculation was using local container coordinates instead of global scene coordinates:

1. Characters exist in a hierarchical container structure in Phaser
2. The movement calculation `moveToX = originalX + (targetPos.x - originalX) * 0.7` was using container-local coordinates
3. This resulted in incorrect paths when characters were in different parent containers
4. Visual debugging revealed that "Calculated moveTo" points would often be closer to other nearby characters than the intended target

## Solution
Implemented a robust coordinate transformation system that:

1. Properly converts all positions to global scene coordinates before calculating movement paths:
   ```javascript
   // Get global positions for both attacker and target
   let attackerGlobalPos = new Phaser.Math.Vector2();
   this.container.getWorldTransformMatrix().transformPoint(0, 0, attackerGlobalPos);
   
   let targetGlobalPos = new Phaser.Math.Vector2();
   targetSprite.container.getWorldTransformMatrix().transformPoint(0, 0, targetGlobalPos);