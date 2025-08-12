import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { TrashProvider } from './types';

export class WindowsTrash implements TrashProvider {
    async moveToTrash(paths: string[]): Promise<boolean> {
        try {
            // Use PowerShell to move files to Recycle Bin
            for (const path of paths) {
                const escapedPath = path.replace(/'/g, "''");
                const script = `Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('${escapedPath}', 'OnlyErrorDialogs', 'SendToRecycleBin')`;

                try {
                    execSync(`powershell -Command "${script}"`, {
                        stdio: 'pipe',
                        timeout: 10000
                    });
                } catch (error) {
                    // Try alternative method using recycle-bin package if available
                    await this.fallbackMoveToTrash(path);
                }
            }
            return true;
        } catch (error) {
            console.error('Failed to move files to Recycle Bin:', error);
            return false;
        }
    }

    private async fallbackMoveToTrash(path: string): Promise<void> {
        try {
            // Try using the recycle-bin npm package if available
            let recycleBin: any = null;
            try {
                // Use eval to avoid TypeScript compilation issues with optional dependency
                recycleBin = await eval('import("recycle-bin")');
            } catch {
                // recycle-bin package not available
            }

            if (recycleBin) {
                await recycleBin.default([path]);
            } else {
                throw new Error('No fallback method available for Windows trash');
            }
        } catch (error) {
            throw new Error(`Failed to move ${path} to Recycle Bin: ${error}`);
        }
    }

    async getTrashSize(): Promise<number> {
        try {
            // Query Recycle Bin size using PowerShell
            const script = `
        $recycleBin = (New-Object -ComObject Shell.Application).NameSpace(10)
        $size = 0
        $recycleBin.Items() | ForEach-Object { $size += $_.Size }
        Write-Output $size
      `;

            const result = execSync(`powershell -Command "${script}"`, {
                encoding: 'utf8',
                stdio: 'pipe'
            });

            return parseInt(result.trim()) || 0;
        } catch (error) {
            return 0;
        }
    }

    isSupported(): boolean {
        return process.platform === 'win32';
    }
}