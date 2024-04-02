// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

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


function lsDirectory(currentDir: string): Promise<string[]> {
	return new Promise((resolve, reject) => {
		// Listar los archivos en el directorio
		fs.readdir(currentDir, (err, files) => {
			if (err) {
				vscode.window.showErrorMessage(`Error al leer el directorio: ${err.message}`);
				return reject(err);
			}

			// Mostrar los archivos en la consola
			console.log('Archivos en el directorio:');
			files.forEach(file => {
				console.log(file);
			});
			resolve(files);
		});
	});
}

function getModuleFolder(): Promise<string> {
	return new Promise((resolve, reject) => {
		// Obtener el editor de texto activo
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			reject('No seleccionó ningun archvo');
		}
		let finded = false;

		let cur_folder = editor!.document.uri.fsPath;
		let prev_folder = cur_folder;
		while (!finded) {
			cur_folder = path.dirname(cur_folder);
			if (path.basename(cur_folder) === 'addons') {
				// revisar si la carpeta contiene init.py y al capeta wizard
				lsDirectory(cur_folder)
					.then(files => {
						let x = 19;
						x = 19;
						x = 19;
						resolve(prev_folder);
					})
					.catch(err => reject(err));
			}
			prev_folder = cur_folder;
		}
		resolve(cur_folder);
	});
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "odoo-awesome" is now active!');

	//====================================
	//OERP 7
	//====================================
	let oerp7_new_wizard = vscode.commands.registerCommand('oerp7_new_wizard', () => {
		let wiz_name: string | undefined;
		let wiz_path: string | undefined;

		const inputBox = vscode.window.createInputBox();
		inputBox.title = "Nuevo wizard";
		inputBox.placeholder = "Nombre del wizard";
		inputBox.onDidChangeValue(value => {
			if (value.includes(' ')) {
				inputBox.validationMessage = 'No puede contener espacios';
			} else {
				inputBox.validationMessage = '';
			}
			wiz_name = value.trim().toLowerCase().replaceAll(' ', '_');

		});
		inputBox.onDidAccept(() => {
			if (wiz_name) {
				// Armar un nombre con el de la carpeta conedora
				getModuleFolder().then(folder => {
					vscode.window.showInformationMessage(`Wizard creado '${wiz_name}'.`);
				}).catch(err => vscode.window.showErrorMessage("Algo ha salido mal."))
				inputBox.hide();
			} else {
				vscode.window.showErrorMessage("Creación del wizard cancelada.");
				inputBox.hide();
			}
		});
		inputBox.show();
	});
	context.subscriptions.push(oerp7_new_wizard);

	//====================================
	//ODOO
	//====================================

	// Comando para crear un nuevo modulo vacío
	let odoo_new_module = vscode.commands.registerCommand('odoo-new-module', () => {
		let newModuleName: string | undefined;
		const inputBox = vscode.window.createInputBox();
		inputBox.title = "Crear nuevo módulo de odoo";
		inputBox.placeholder = "Nombre del módulo";
		inputBox.onDidChangeValue(value => {
			if (value.includes(' ')) {
				inputBox.validationMessage = 'No puede contener espacios';
			} else {
				inputBox.validationMessage = '';
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
	context.subscriptions.push(odoo_new_module);

}

// This method is called when your extension is deactivated
export function deactivate() { }
