/* eslint-disable jsdoc/require-jsdoc */
import { readdir } from 'node:fs/promises'
import { parse, resolve } from 'node:path'

import { VariableDeclarationKind } from 'ts-morph'
import { createTsScriptProgram, type TsScript } from './shared'

/** @deprecated */
export async function syncResourceKeys () {
    const program = createTsScriptProgram('keys.ts')

    const files = await readdir(resolve('.', './src/schemas/v2/resources/'), { encoding: 'utf8' })

    const names: string[] = []
    for (const file of files) {
        const name = createResourceKeyFile(program, file)
        names.push(name)
    }

    program.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        docs: [
            {
                tags: [{ tagName: 'deprecated' }],
            }
        ],
        declarations: [{
            name: 'SchemaKeys',
            initializer: writer =>
                writer.write(`{ ${names.reduce((str, key, i) => str + (i ? ', ' : '') + `${key}`, '')} }`)
        }]
    })

    await program.save()
}

function createResourceKeyFile ({ file, project }: TsScript, fileName: string) {
    const sourceFile = project.addSourceFileAtPath('./src/schemas/v2/resources/' + fileName)

    const name = snakeCaseToPascalCase(parse(fileName).name)
    const resource = sourceFile.getInterface(name)
    if (!resource) throw new Error(fileName)

    const allKeys = resource.getProperties().map(p => p.getName())
    file.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        declarations: [{
            name: name,
            initializer: writer =>
                writer.write(`[${allKeys.reduce((str, key, i) => str + (i ? ', ' : '') + `'${key}'`, '')}] as const`)
        }]
    })

    return name
}

function snakeCaseToPascalCase(input: string): string {
    return input
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('')
}
