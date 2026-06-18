---
name: mcp-automatic-data-collection
description: Enforces MCP automatic data collection rules to ensure all file content changes are recorded correctly. When editing, creating, or deleting files, MCP tools must be called in strict paired before/after sequences.
---

# MCP Automatic Data Collection Rules

## When to Use This Skill

Use this skill in the following scenarios:

- Performing any operation that modifies file content (edit, create, delete)
- Recording AI assistant and user conversation sessions
- Ensuring file change operations are fully tracked and recorded

## Core Principles

- **File content changed** → must record
- **No file content changed** → no recording needed

## Trigger Conditions

### Before File Content Changes

Before performing any of the following operations, call `beforeEditFile` first:

- `write` - write to a file
- `search_replace` - search and replace content
- `MultiEdit` - multi-file edit
- `create_file` - create a new file
- `delete_file` - delete a file
- Any other operation that modifies file content

### After File Content Changes

After the file change operation completes, call `afterEditFile`.

### End of Conversation

At the end of each conversation turn, call `recordSession`.

## Operation Categories

### Operations That Require MCP Recording (File Content Changes)

- `create_file` - create a new file
- `delete_file` - delete a file
- `search_replace` - search and replace content
- `edit_file` - edit file content
- Any other operation that modifies file content

### Operations That Do Not Require MCP Recording (Read-Only)

- `read_file` - read a file
- `list_dir` - list directory contents
- `grep` - search file contents
- `codebase_search` - codebase search
- Other read-only operations

## Execution Flow

### Conversation Only (No File Changes)

```
End of conversation → recordSession
```

### File Content Change

```
beforeEditFile → [file change operation] → afterEditFile → recordSession
```

### Read-Only Analysis (No MCP Trigger)

```
[read/analyze operations] → analysis result → recordSession
```

## Mandatory Requirements

### 100% Coverage

- No omissions or skips allowed
- All file content change operations must be recorded

### Strict Pairing

- Each `beforeEditFile` must have exactly one corresponding `afterEditFile` call
- Omissions, skips, or merged operations are not allowed
- Do not merge multiple operations into a single `afterEditFile` call

### Session Consistency

- Determine a single `sessionId` at the start of the conversation
- Keep that ID unchanged across all subsequent turns
- Use the same `sessionId` for all operations in a session

### Path Convention

- Use absolute file paths only
- Relative paths are not allowed
- List the absolute paths of all involved files

## Violation Handling

### Immediate Detection

- Self-check pairing completeness after each file operation
- Verify every `beforeEditFile` has a matching `afterEditFile`
- Verify all file change operations were recorded correctly

### Mandatory Correction

- Stop immediately when an omission is detected
- Add the missing MCP tool calls
- Ensure the workflow is complete before continuing

### Re-execution

- Violating operations must be re-run through the full workflow
- Continue only after all mandatory requirements are met

## Common Violation Examples

### ❌ Wrong Example 1: Merged Recording

```typescript
// Wrong: merging multiple operations into one afterEditFile
beforeEditFile(file1)
editFile(file1)
editFile(file2) // Wrong: file2 has no beforeEditFile
afterEditFile(file1) // Wrong: only file1 was recorded
```

### ✅ Correct Example 1: Separate Recording

```typescript
// Correct: record each file separately
beforeEditFile(file1)
editFile(file1)
afterEditFile(file1)

beforeEditFile(file2)
editFile(file2)
afterEditFile(file2)
```

### ❌ Wrong Example 2: Missing Pair

```typescript
// Wrong: afterEditFile not called after beforeEditFile
beforeEditFile(file1)
editFile(file1)
// afterEditFile was omitted
```

### ✅ Correct Example 2: Complete Pairing

```typescript
// Correct: complete pairing workflow
beforeEditFile(file1)
editFile(file1)
afterEditFile(file1)
```

### ❌ Wrong Example 3: Skipped Recording

```typescript
// Wrong: file change without calling MCP tools
editFile(file1) // Wrong: no beforeEditFile
```

### ✅ Correct Example 3: Complete Recording

```typescript
// Correct: complete recording workflow
beforeEditFile(file1)
editFile(file1)
afterEditFile(file1)
```

### ❌ Wrong Example 4: Wrong Path

```typescript
// Wrong: relative path
beforeEditFile('./src/file.ts') // Wrong: relative path
```

### ✅ Correct Example 4: Absolute Path

```typescript
// Correct: absolute path
beforeEditFile('/absolute/path/to/src/file.ts')
```

### ❌ Wrong Example 5: Incorrect Trigger

```typescript
// Wrong: calling beforeEditFile/afterEditFile for read-only operations
beforeEditFile(file1) // Wrong: read_file is read-only
readFile(file1)
afterEditFile(file1) // Wrong: read_file should not trigger MCP
```

### ✅ Correct Example 5: Read-Only Does Not Trigger

```typescript
// Correct: read-only operations do not trigger MCP tools
readFile(file1) // Read-only; no MCP calls needed
```

## Verification Checklist

When performing file change operations, verify:

- [ ] Was `beforeEditFile` called before the file change?
- [ ] Was `afterEditFile` called after the file change?
- [ ] Does each `beforeEditFile` have a matching `afterEditFile`?
- [ ] Were absolute file paths used?
- [ ] Was `sessionId` kept consistent throughout the conversation?
- [ ] Was `recordSession` called at the end of the conversation?
- [ ] Were MCP tools incorrectly called for read-only operations?
- [ ] Were multiple operations merged into a single `afterEditFile` call?

## Best Practices

1. **Plan ahead**: decide which MCP tools to call before file change operations
2. **Record immediately**: call the corresponding MCP tools right after each file change; do not delay
3. **Strict pairing**: ensure each `beforeEditFile` has a matching `afterEditFile`
4. **Path check**: always use absolute paths to avoid path errors
5. **Session management**: set `sessionId` at conversation start and keep it consistent
6. **Error recovery**: if an omission is found, stop immediately and add the missing calls

## Notes

- These rules are **mandatory**; no exceptions
- Violations may result in incomplete data collection and affect later analysis
- When unsure whether an operation should be recorded, prefer recording
- Read-only operations (e.g. `read_file`) do not require MCP tool calls
