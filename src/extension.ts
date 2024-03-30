// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as path from 'path';

function call_odoo_scafold(
	mdl: string,
	mdl_path: string,
	odoo_bin_folder: string,
	python_bin_path: string
): Promise<void> {
	return new Promise((resolve, reject) => {
		// Ruta completa del script Python que deseas ejecutar
		const scriptPython = path.join(odoo_bin_folder, `odoo-bin scaffold ${mdl} ${mdl_path}`);

		// Ejecutar el script Python
		child_process.exec(`${python_bin_path}/python ${scriptPython}`, (error, stdout, stderr) => {
			if (error) {
				vscode.window.showErrorMessage(`Error al ejecutar Odoo scafold: ${error.message}`);
				reject(error);
			}
			if (stderr) {
				vscode.window.showErrorMessage(`Error al ejecutar Odoo scafold: ${stderr}`);
				reject(stderr);
			}
			vscode.window.showInformationMessage(`Módulo creado "${mdl}" `);
			resolve();
		});
	});

}

function get_modules_path(): Promise<string> {
	return new Promise((resolve, reject) => {
		const config = vscode.workspace.getConfiguration('odoo-awesome');
		const key = 'modules_directory';
		const def_path = config.get(key);
		const options: vscode.OpenDialogOptions = {
			openLabel: 'Folder to save module',
			canSelectMany: false, canSelectFiles: false, canSelectFolders: true,
			defaultUri: def_path !== '' ? vscode.Uri.file(def_path + '') : undefined
		};
		vscode.window.showOpenDialog(options).then(resUri => {
			if (resUri && resUri[0]) {
				let res_path: string = resUri[0].fsPath + '';
				// Configurar la carpeta seleccionda comp carpeta por defecto
				config.update(key, res_path, vscode.ConfigurationTarget.Global)
					.then(() => {
						console.log('Modules folder default updated!!');
						resolve(res_path);
					});
			} else {
				reject('x');
			}
		});
	});
}

function get_odoo_bin_folder(): Promise<string> {
	return new Promise((resolve, reject) => {
		const config = vscode.workspace.getConfiguration('odoo-awesome');
		const key = 'odoo-bin-path';
		const res = config.get(key);
		if (res != '') {
			resolve(res + '');
		} else {
			const options: vscode.OpenDialogOptions = {
				openLabel: 'Select ODOO BIN folder',
				canSelectMany: false, canSelectFiles: false, canSelectFolders: true
			};
			vscode.window.showOpenDialog(options).then(resUri => {
				if (resUri && resUri[0]) {
					let res_path = resUri[0].fsPath + '';
					config.update(key, res_path, vscode.ConfigurationTarget.Global)
						.then(() => {
							console.log('Odoo folder updated!!');
							resolve(res_path);
						});
				} else {
					reject();
				}
			});
		}
	});
}

function get_python_bin_folder(): Promise<string> {
	return new Promise((resolve, reject) => {
		const config = vscode.workspace.getConfiguration('odoo-awesome');
		const key = 'python-bin-folder';
		const res = config.get(key);
		if (res != '') {
			resolve(res + '');
		} else {
			const options: vscode.OpenDialogOptions = {
				openLabel: 'Select PYTHON BIN folder',
				canSelectMany: false, canSelectFiles: false, canSelectFolders: true
			};
			vscode.window.showOpenDialog(options).then(resUri => {
				if (resUri && resUri[0]) {
					let res_path = resUri[0].fsPath + '';
					config.update(key, res_path, vscode.ConfigurationTarget.Global)
						.then(() => {
							console.log('PYTHON folder updated!!');
							resolve(res_path);
						});
				} else {
					reject();
				}
			});
		}
	});
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const config = vscode.workspace.getConfiguration('odoo-awesome');

	// También puedes escuchar cambios en las preferencias
	const disposables = vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('odoo-awesome.odoo-bin-path')) {
			const newValue = config.get('odoo-bin-path');
			console.log('La preferencia odoo-awesome.odoo-bin-path ha cambiado:', newValue);
			vscode.window.showErrorMessage("Creación del módulo cancelada.");
		}
	});

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "odoo-awesome" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('odoo-new-module', () => {
		let newModuleName: string | undefined;
		const inputBox = vscode.window.createInputBox();
		inputBox.title = "Crear nuevo módulo de odoo";
		inputBox.placeholder = "Nombre del módulo";
		inputBox.placeholder = "Nombre del módulo";
		inputBox.onDidChangeValue(value => {
			if (value.includes(' ')){
				inputBox.validationMessage = 'No puede contener espacios';
			} else {
				inputBox.validationMessage = ''
			}
			newModuleName = value.trim().toLowerCase().replaceAll(' ', '_');
		});
		inputBox.onDidAccept(() => {
			if (newModuleName) {
				let mdl_path: string;
				let odoo_bin_path: string;
				let python_bin_path: string;
				get_modules_path()
					.then(path => {
						mdl_path = path;
						return get_odoo_bin_folder();
					})
					.then(path => {
						odoo_bin_path = path;
						return get_python_bin_folder();
					})
					.then(path => {
						python_bin_path = path;
						return call_odoo_scafold(newModuleName!, mdl_path!, odoo_bin_path!, python_bin_path!);
					})
					.catch(err => {
						vscode.window.showErrorMessage("Creación del módulo cancelada.");
					});
				inputBox.hide();
			} else {
				vscode.window.showErrorMessage("Creación del módulo cancelada.");
				inputBox.hide();
			}
		});
		inputBox.show();



	});

	context.subscriptions.push(disposable);

}

// This method is called when your extension is deactivated
export function deactivate() { }
