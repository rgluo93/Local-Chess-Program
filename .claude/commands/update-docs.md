# Update Documentation Command

## Command: /update-docs

**Purpose**: Automatically update project documentation after completing a development phase or making significant changes.

## Usage

```
/update-docs [phase-number] [status] [notes]
```

### Parameters

- `phase-number` (optional): Phase number completed (1-6)
- `status` (required): `completed` | `in-progress` | `failed`  
- `notes` (optional): Brief notes about changes or issues

### Examples

```bash
# Mark Phase 1 as completed
/update-docs 1 completed "All basic game logic implemented"

# Mark Phase 3 as in-progress
/update-docs 3 in-progress "Working on drag-and-drop system"

# Update docs without specific phase
/update-docs completed "Fixed TypeScript interfaces"
```

## What This Command Does

1. **Updates IMPLEMENTATION_PLAN.md**:
   - Marks phase status and checkboxes
   - Updates overall progress percentage
   - Adds completion timestamps
   - Records notes and issues

2. **Updates README.md**:
   - Refreshes feature completion status
   - Updates setup instructions if needed
   - Modifies troubleshooting section

3. **Updates API_DOCUMENTATION.md**:
   - Adds new APIs and interfaces
   - Updates examples with working code
   - Documents breaking changes

4. **Updates TESTING.md**:
   - Marks test scenarios as passing/failing
   - Updates performance benchmarks
   - Adds new test procedures

5. **Generates Progress Report**:
   - Creates phase completion summary
   - Identifies remaining tasks
   - Highlights any blockers or issues

## Automated Updates

The command performs these updates automatically:

### Phase Status Tracking
- Updates phase checkboxes from ⬜ to ✅
- Calculates and updates overall progress percentage
- Timestamps phase completion
- Tracks time spent per phase

### Feature Status Updates
- Updates README feature list with current status
- Modifies "What's Working" vs "What's Coming" sections
- Updates browser compatibility matrix

### Test Scenario Tracking
- Marks test scenarios as ✅ Pass or ❌ Fail
- Updates test coverage statistics
- Records performance benchmark results

### API Documentation Sync
- Updates interface examples with real implementations
- Adds newly implemented methods and classes
- Removes deprecated or changed APIs

## Output Files

After running the command, these files are updated:

- `IMPLEMENTATION_PLAN.md` - Phase progress and status
- `README.md` - Feature status and setup info  
- `API_DOCUMENTATION.md` - Current API state
- `TESTING.md` - Test results and benchmarks
- `PROGRESS_REPORT.md` (generated) - Current project status

## Phase-Specific Updates

### Phase 1 Completion
- Updates project setup status
- Documents core interfaces implemented
- Updates dependency installation results

### Phase 2 Completion  
- Updates UI component documentation
- Records Canvas/SVG rendering approach
- Documents color theme implementation

### Phase 3 Completion
- Updates animation system docs
- Records performance benchmarks
- Documents drag-and-drop implementation

### Phase 4 Completion
- Updates responsive design documentation
- Records zoom system implementation
- Updates browser compatibility results

### Phase 5 Completion
- Updates save/load system documentation
- Documents storage schema
- Updates export/import functionality

### Phase 6 Completion
- Generates final project documentation
- Creates deployment guide
- Updates performance benchmarks
- Finalizes user guide

## Integration with Development Workflow

### Recommended Usage Pattern

```bash
# Before starting a phase
/update-docs 2 in-progress "Starting basic UI development"

# During development (as needed)
/update-docs 2 in-progress "Canvas rendering working, starting piece placement"

# After completing phase
/update-docs 2 completed "All basic UI components implemented and tested"
```

### Git Integration

The command can optionally:
- Stage updated documentation files
- Create commit with standardized message
- Update CHANGELOG.md with changes

### Continuous Documentation

This ensures documentation stays current and accurate throughout development, rather than becoming outdated.

## Error Handling

The command handles these scenarios:
- Invalid phase numbers (1-6 only)
- Missing required parameters
- File permission issues
- Invalid status values

## Customization

Edit this file to customize:
- Which files get updated
- Update patterns and templates
- Progress calculation methods
- Report generation format