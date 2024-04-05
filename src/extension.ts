// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { Console } from 'console';

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
				reject('No se puede obtener el directorio');
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

function checkValidOerpDir(path: string): boolean {
	let elements_to_check = ['__init__.py', '__openerp__.py', 'wizard', 'report'];
	const files = fs.readdirSync(path);
	return elements_to_check.every(x => files.includes(x));
}

function getModuleFolderoERP7(): Promise<{ module_name: string, module_path: string }> {
	return new Promise((resolve, reject) => {
		// Obtener el editor de texto activo
		const editor = vscode.window.activeTextEditor;
		let cur_folder = editor!.document.uri.fsPath;
		while (cur_folder !== '/') {
			cur_folder = path.dirname(cur_folder);
			if (checkValidOerpDir(cur_folder)) {
				return resolve({
					'module_name': path.basename(cur_folder),
					'module_path': cur_folder
				});
			}
		}
		reject('No se encontró un modulo de OpenERP 7.0');
	});
}

function inputNameWizardOERP7(module: string): Promise<string> {
	return new Promise((resolve, reject) => {
		let wiz_name: string | undefined;
		const inputBox = vscode.window.createInputBox();
		inputBox.title = `Nuevo wizard / ${module.toUpperCase()}`;
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
				resolve(wiz_name);
			} else {
				reject(new Error('Creación del wizard cancelada.'));
				inputBox.hide();
			}
		});
		inputBox.show();
	});
}

async function abrirArchivo(rutaArchivo: string) {
	try {
		// Abre el archivo como un documento de texto
		const documento = await vscode.workspace.openTextDocument(rutaArchivo);

		// Muestra el documento en el editor
		await vscode.window.showTextDocument(documento);
	} catch (error) {
		console.error('Error al abrir el archivo:', error);
	}
}


function capitalizeText(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

async function createFile(
	file_path: string, placeholder_path: string,
	model_name: string, wiz_name: string,
	open_file: boolean = false
) {
	try {
		// Abre el archivo como un documento de texto
		let txt_placeholder = '';
		if (placeholder_path !== '') {
			let doc = await vscode.workspace.openTextDocument(placeholder_path);
			txt_placeholder = doc.getText()
				.replaceAll('_CLASS_TABLE_', model_name.replaceAll('.', '_'))
				.replaceAll('_CLASS_MODEL_', model_name)
				.replaceAll('_WIZARD_NAME_', capitalizeText(wiz_name).replaceAll('_', ' ').replaceAll('.', ' '));
		}
		fs.writeFileSync(file_path, txt_placeholder);
		if (open_file) { abrirArchivo(file_path); }
	} catch (error) {
		console.error('Error al abrir el archivo:', error);
	}
}

async function includePyFileWiz(dir_path: string, file_name: string): Promise<void> {
	return new Promise(async (resolve, reject) => {
		let to_replace = '# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:';
		let new_text = `import ${file_name}\n${to_replace}`;
		let file_path = `${dir_path}/wizard/__init__.py`;
		try {
			let doc_content = (await vscode.workspace.openTextDocument(file_path)).getText();
			// Revisar si encuentra el pie de archivo caso contrario agregar el import al final de archivo
			if (doc_content.includes(to_replace)) {
				doc_content = doc_content.replace(to_replace, new_text);
			} else {
				doc_content += new_text;
			}
			fs.writeFileSync(file_path, doc_content);
			resolve();
		} catch (error) {
			reject(new Error(`No se pudo incluir "${file_name}" al __init.py__ de los wizard. Hagalo manualmente`));
		}
	});
}

async function includeXMLFileWiz(dir_path: string, file_name: string): Promise<void> {
	return new Promise(async (resolve, reject) => {
		let to_replace = "'update_xml': [";
		let new_text = `${to_replace}\n'wizard/${file_name}_view.xml'`;
		let file_path = `${dir_path}/__openerp__.py`;
		try {
			let doc_content = (await vscode.workspace.openTextDocument(file_path)).getText();
			// Revisar si encuentra el pie de archivo caso contrario agregar el import al final de archivo
			if (doc_content.includes(to_replace)) {
				doc_content = doc_content.replace(to_replace, new_text);
			} else if (doc_content.includes(to_replace.replaceAll(' ', ''))) {
				to_replace = to_replace.replaceAll(' ', '');
				doc_content = doc_content.replace(to_replace, new_text);
			}
			fs.writeFileSync(file_path, doc_content);
			resolve();
		} catch (error) {
			reject(new Error(`No se pudo incluir "${file_name}" al __init.py__ de los wizard. Hagalo manualmente`));
		}
	});
}


function create_filesWizard(dir_path: string, module_name: string, wiz_name: string): Promise<string> {
	return new Promise((resolve, reject) => {
		let ext_dir = path.resolve(__dirname, '..', 'src');
		let mdl = module_name?.toLowerCase().replaceAll(' ', '_');
		let file_name = wiz_name.toLowerCase().replaceAll(' ', '_').replaceAll('.', '_');
		let model: string = `${mdl}_${file_name}_wizard`.toLowerCase().replaceAll('_', '.');
		// Crear los archivos
		let model_name: string | undefined;
		const inputBox = vscode.window.createInputBox();
		inputBox.title = "Modelo del nuevo wizard";
		inputBox.value = model;
		model_name = model;
		inputBox.placeholder = "modelo";

		inputBox.onDidChangeValue(value => {
			if (value.includes(' ')) {
				inputBox.validationMessage = 'No puede contener espacios';
			} else {
				inputBox.validationMessage = '';
			}
			model_name = value.trim().toLowerCase().replaceAll(' ', '_');
		});
		inputBox.onDidAccept(() => {
			if (model_name) {
				// crear archivo Python
				let path_py_file = `${dir_path}/wizard/${file_name}.py`;
				let py_placeholder = `${ext_dir}/placeholder/wizard_py_def_content.py`;
				createFile(path_py_file, py_placeholder, model_name, wiz_name, true);

				// crear archivo xml para vistas
				let path_xml_file = `${dir_path}/wizard/${file_name}_view.xml`;
				let xml_placeholder = `${ext_dir}/placeholder/wizard_xml_def_content.xml`;
				createFile(path_xml_file, xml_placeholder, model_name, wiz_name);
				// Agregar nuevo wizard al imports
				includePyFileWiz(dir_path, file_name).catch(err => vscode.window.showErrorMessage(err));
				includeXMLFileWiz(dir_path, file_name).catch(err => vscode.window.showErrorMessage(err));

				inputBox.hide();
				resolve(file_name);
			} else {
				vscode.window.showErrorMessage("Creación del wizard cancelada.");
				inputBox.hide();
			}
		});
		inputBox.show();
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
		// Revisar si antes se seleccioó un archivo del proyecto
		if (!vscode.window.activeTextEditor) {
			vscode.window.showWarningMessage("Primero abra un archivo del proyecto.");
			return;
		}
		let module: { module_name: string, module_path: string };
		let wiz_name: string;
		getModuleFolderoERP7().then(mdl => {
			module = mdl;
			return inputNameWizardOERP7(module.module_name);
		}).then(name => {
			wiz_name = name;
			return create_filesWizard(module.module_path, module.module_name, wiz_name);
		}).then(x => {
			vscode.window.showInformationMessage(`Wizard creado '${wiz_name}'.`);
		}).catch(err => {
			vscode.window.showErrorMessage(err);
		});
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
