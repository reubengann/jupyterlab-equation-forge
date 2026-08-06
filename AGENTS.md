# Agent Instructions For This Repository

## Python Environment

Use the `work` conda environment for all Python commands (tests, scripts, one-off checks).

PowerShell command pattern:

```powershell
$conda = "$env:USERPROFILE\anaconda3\Scripts\conda.exe"
& $conda run -n work <command>
```

If editing equation-forge package in addition to this one, you have to force that package to rebuild artifacts. package.json has a build:with-upstream command defined.
