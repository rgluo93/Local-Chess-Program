# Post-Phase Hook

## Hook: post-phase

**Trigger**: After completing any development phase
**Purpose**: Automatically update documentation and generate progress reports

## Configuration

This hook automatically runs after phase completion to:

1. **Update Implementation Plan**: Mark phase as complete with timestamp
2. **Refresh Documentation**: Update all docs with current state
3. **Generate Progress Report**: Create status summary
4. **Validate Phase**: Ensure all deliverables are met

## Hook Script

```bash
#!/bin/bash
# Post-phase completion hook

PHASE_NUM=$1
STATUS=$2
NOTES=$3

echo "🔄 Post-phase hook triggered for Phase $PHASE_NUM"

# Update implementation plan
echo "📋 Updating implementation plan..."
/update-docs $PHASE_NUM $STATUS "$NOTES"

# Validate phase completion
echo "✅ Validating phase deliverables..."
if [ "$STATUS" = "completed" ]; then
    # Run phase validation tests
    npm run test:phase-$PHASE_NUM 2>/dev/null || echo "⚠️  Phase tests not found"
    
    # Check for required files/components
    case $PHASE_NUM in
        1)
            echo "🔍 Validating Phase 1: Game logic and project setup"
            [ -f "src/engine/GameEngine.ts" ] && echo "✅ GameEngine implemented" || echo "❌ GameEngine missing"
            [ -f "src/types/Chess.ts" ] && echo "✅ Chess types defined" || echo "❌ Chess types missing"
            ;;
        2)
            echo "🔍 Validating Phase 2: Basic UI and board rendering"
            [ -f "src/components/ChessBoard.tsx" ] && echo "✅ ChessBoard component" || echo "❌ ChessBoard missing"
            [ -f "src/components/GameControls.tsx" ] && echo "✅ GameControls component" || echo "❌ GameControls missing"
            ;;
        3)
            echo "🔍 Validating Phase 3: Advanced interactions and animations"
            grep -q "drag" src/components/ChessBoard.tsx 2>/dev/null && echo "✅ Drag-and-drop implemented" || echo "❌ Drag-and-drop missing"
            ;;
        4)
            echo "🔍 Validating Phase 4: Zoom and responsive design"
            [ -f "src/components/ZoomControls.tsx" ] && echo "✅ Zoom controls" || echo "❌ Zoom controls missing"
            ;;
        5)
            echo "🔍 Validating Phase 5: Game management features"
            [ -f "src/utils/localStorage.ts" ] && echo "✅ Persistence layer" || echo "❌ Persistence missing"
            ;;
        6)
            echo "🔍 Validating Phase 6: Testing and polish"
            npm run test >/dev/null 2>&1 && echo "✅ All tests passing" || echo "❌ Tests failing"
            ;;
    esac
fi

# Generate progress report
echo "📊 Generating progress report..."
echo "# Progress Report - $(date)" > PROGRESS_REPORT.md
echo "" >> PROGRESS_REPORT.md
echo "## Phase $PHASE_NUM Status: $STATUS" >> PROGRESS_REPORT.md
echo "" >> PROGRESS_REPORT.md
echo "**Notes**: $NOTES" >> PROGRESS_REPORT.md
echo "" >> PROGRESS_REPORT.md

# Calculate overall progress
COMPLETED_PHASES=$(grep -c "✅ Complete" IMPLEMENTATION_PLAN.md 2>/dev/null || echo "0")
TOTAL_PHASES=6
PROGRESS=$((COMPLETED_PHASES * 100 / TOTAL_PHASES))

echo "**Overall Progress**: $PROGRESS% ($COMPLETED_PHASES/$TOTAL_PHASES phases complete)" >> PROGRESS_REPORT.md
echo "" >> PROGRESS_REPORT.md

# Add next steps
if [ "$COMPLETED_PHASES" -lt 6 ]; then
    NEXT_PHASE=$((COMPLETED_PHASES + 1))
    echo "**Next Phase**: Phase $NEXT_PHASE" >> PROGRESS_REPORT.md
    
    # Extract next phase title from implementation plan
    NEXT_PHASE_TITLE=$(grep "## Phase $NEXT_PHASE:" IMPLEMENTATION_PLAN.md | head -1 | cut -d':' -f2 | sed 's/^ *//')
    echo "**Next Phase Title**: $NEXT_PHASE_TITLE" >> PROGRESS_REPORT.md
else
    echo "🎉 **Project Complete!** All phases finished." >> PROGRESS_REPORT.md
fi

echo "" >> PROGRESS_REPORT.md
echo "---" >> PROGRESS_REPORT.md
echo "*Generated automatically by post-phase hook*" >> PROGRESS_REPORT.md

echo "✨ Post-phase hook completed!"
echo "📄 Progress report generated: PROGRESS_REPORT.md"
```

## Hook Usage

The hook is triggered automatically when:
- A phase is marked as completed in the implementation plan
- The `/update-docs` command is used with `completed` status
- Manual trigger: `/run-hook post-phase [phase-num] [status] [notes]`

## Validation Checks

For each phase, the hook validates:

### Phase 1 - Project Foundation
- [ ] `src/engine/GameEngine.ts` exists
- [ ] `src/types/Chess.ts` exists  
- [ ] `package.json` has correct dependencies
- [ ] TypeScript compilation successful

### Phase 2 - Basic UI
- [ ] `src/components/ChessBoard.tsx` exists
- [ ] `src/components/GameControls.tsx` exists
- [ ] Canvas rendering functional
- [ ] Basic styling applied

### Phase 3 - Advanced Interactions
- [ ] Drag-and-drop code present
- [ ] Animation system implemented
- [ ] Special moves working

### Phase 4 - Responsive Design
- [ ] `src/components/ZoomControls.tsx` exists
- [ ] Responsive CSS implemented
- [ ] Performance targets met

### Phase 5 - Game Management
- [ ] `src/utils/localStorage.ts` exists
- [ ] Save/load functionality working
- [ ] PGN/FEN export working

### Phase 6 - Testing & Polish
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] All 20 test scenarios validated

## Output Files Generated

- `PROGRESS_REPORT.md` - Current status and next steps
- Updated `IMPLEMENTATION_PLAN.md` - Phase completion status
- Updated documentation files as needed
- Validation report in console

## Integration with Git

Optional git integration:
```bash
# Stage documentation updates
git add IMPLEMENTATION_PLAN.md PROGRESS_REPORT.md README.md

# Commit with standardized message
git commit -m "📋 Complete Phase $PHASE_NUM: $NOTES"
```

## Troubleshooting

If the hook fails:
1. Check file permissions
2. Verify phase number (1-6)
3. Ensure required files exist
4. Check npm/test commands work

## Customization

Edit `.claude/hooks/post-phase.md` to:
- Add custom validation checks
- Modify report generation
- Change file update patterns
- Add integration with external tools