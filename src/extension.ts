// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

function call_odoo_scafold(mdl: string, mdl_path: string): void {
	// Ruta completa del script Python que deseas ejecutar
	let python_bin = '/home/edgar/venvs/3.10/bin/python';
	let odoo_bin = '/home/edgar/Git/odoo/';
	const scriptPython = path.join(odoo_bin, `odoo-bin scaffold ${mdl} ${mdl_path}`);

	// Ejecutar el script Python
	child_process.exec(`${python_bin} ${scriptPython}`, (error, stdout, stderr) => {
		if (error) {
			vscode.window.showErrorMessage(`Error al ejecutar el script Python: ${error.message}`);
			return;
		}
		if (stderr) {
			vscode.window.showErrorMessage(`Error al ejecutar el script Python: ${stderr}`);
			return;
		}
		vscode.window.showInformationMessage(`Script Python ejecutado correctamente. Salida: ${stdout}`);
	});

}


export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "odoo-awesome" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('odoo-new-module', () => {
		let valorUsuario: string | undefined;

		const inputBox = vscode.window.createInputBox();
		inputBox.title = "Crear nuevo módulo de odoo";
		inputBox.placeholder = "Nombre del módulo";
		inputBox.onDidChangeValue(value => {
			valorUsuario = value;
		});
		inputBox.onDidAccept(() => {
			if (valorUsuario) {

				const options: vscode.OpenDialogOptions = {
					canSelectMany: false,
					openLabel: 'Select',
					canSelectFiles: false,
					canSelectFolders: true
				};

				vscode.window.showOpenDialog(options).then(fileUri => {
					
					if (fileUri && fileUri[0]) {
						let xPath = fileUri[0].fsPath;
						call_odoo_scafold(valorUsuario + '', xPath);
						//vscode.window.showInformationMessage(`Nuevo módulo a crear: ${xPath}`);
					}
				});


				inputBox.hide();
			} else {
				vscode.window.showInformationMessage("Creación del módulo cancelada.");
				inputBox.hide();
			}
		});
		inputBox.show();





	});

	context.subscriptions.push(disposable);

}

// This method is called when your extension is deactivated
export function deactivate() { }
