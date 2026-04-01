/* eslint-disable jsdoc/require-jsdoc */
import {
    NewLineKind,
    Project,
    QuoteKind,
    ts,
    type JSDocableNode,
    type SourceFile,
} from 'ts-morph'

import { Type } from '../../schemas/v2/item'

export interface TsScript {
    project: Project
    file: SourceFile
    save(): Promise<void>
    addVariableStatement: SourceFile['addVariableStatement']
}

export function getResourceTypeFileConverter () {
    const customFileNames: Record<string, Type> = {
        oauth_client: Type.Client,
        access_rule: Type.LiveAccessRule,
    }

    const getTypeName = (type: Type) => Object.entries(customFileNames).find(([,t]) => t === type)?.[0] ?? type

    return {
        getTypeName,
        fromFile: (fileName: string) => customFileNames[fileName] ?? <Type>fileName.replace('_', '-'),
        fromType: (type: Type) => getTypeName(type).replace('-', '_'),
        toFile: (typeName: string) => typeName.replace('-', '_'),
    }
}

export function createTsScriptProgram (outFilename: string): TsScript {
    const project = new Project({
        tsConfigFilePath: './tsconfig.json',
        manipulationSettings: {
            newLineKind: NewLineKind.CarriageReturnLineFeed,
            quoteKind: QuoteKind.Single,
        },
    })

    const destFile = project.createSourceFile('./src/schemas/v2/generated/' + outFilename, '', {
        overwrite: true,
    })

    return {
        async save () {
            destFile.formatText({
                ensureNewLineAtEndOfFile: true,
                semicolons: ts.SemicolonPreference.Remove,
            })
            await destFile.save()
        },
        file: destFile,
        addVariableStatement: (...args) => destFile.addVariableStatement(...args),
        project,
    }
}

export function getTypes (file: string) {
    const program = createTsScriptProgram('temp.ts')

    const sourceFile = program.project.addSourceFileAtPath(file)
    if (!sourceFile) throw new Error()

    return sourceFile
}

export function getJsDocDescription (node: JSDocableNode): string {
    return node.getJsDocs().at(0)?.getDescription()
        .replace('\r\n', '') // Removes trailing line break
        .replaceAll('\r\n', '\n') // Use LF line endings
        ?? ''
}

export function getJsDocTags (node: JSDocableNode, type: string): (string | undefined)[] | undefined {
    return node.getJsDocs().at(0)?.getTags()
        .filter(tag => tag.getTagName() === type)
        .map(tag => tag.getCommentText())
}
