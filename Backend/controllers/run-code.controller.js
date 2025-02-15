import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export const executeCode = async (req, res) => {
    const { code, language } = req.body;
    const tempDir = path.join(process.cwd(), 'temp');

    // Create temp directory if it doesn't exist
    if (!existsSync(tempDir)) {
        await mkdir(tempDir, { recursive: true });
    }

    const fileId = uuidv4();

    try {
        if (language === 'javascript') {
            // Existing JavaScript execution logic
            const output = [];
            const console = {
                log: (...args) => output.push(args.join(' ')),
                error: (...args) => output.push('Error: ' + args.join(' ')),
                warn: (...args) => output.push('Warning: ' + args.join(' '))
            };

            const sandbox = {
                console,
                setTimeout,
                clearTimeout,
                setInterval,
                clearInterval,
                Date,
                Math,
                String,
                Number,
                Boolean,
                Array,
                Object,
                JSON,
                Error
            };

            const result = new Function(...Object.keys(sandbox), code)(...Object.values(sandbox));
            
            res.json({
                success: true,
                output: output.join('\n'),
                result: result !== undefined ? String(result) : undefined
            });

        } else if (language === 'python') {
            // Python execution logic
            const tempFile = path.join(tempDir, `${fileId}.py`);
            
            // Write Python code to temporary file
            await writeFile(tempFile, code);

            // Execute Python code
            const python = spawn('python', [tempFile]);
            let outputData = '';
            let errorData = '';

            python.stdout.on('data', (data) => {
                outputData += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorData += data.toString();
            });

            python.on('close', async (code) => {
                // Clean up temp file
                try {
                    await unlink(tempFile);
                } catch (err) {
                    console.error('Error deleting temp file:', err);
                }

                if (code === 0) {
                    res.json({
                        success: true,
                        output: outputData.trim(),
                        result: undefined
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: errorData.trim()
                    });
                }
            });

        } else {
            throw new Error('Unsupported language');
        }

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};