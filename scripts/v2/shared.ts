/* eslint-disable jsdoc/require-jsdoc */
import { Project, type SourceFile, NewLineKind, ts, JSDocableNode } from 'ts-morph'

export interface TsScript {
    project: Project
    file: SourceFile
    save(): Promise<void>
    addVariableStatement: SourceFile['addVariableStatement']
}

export function createTsScriptProgram (outFilename: string): TsScript {
    const project = new Project({
        tsConfigFilePath: './tsconfig.json',
        manipulationSettings: {
            newLineKind: NewLineKind.CarriageReturnLineFeed,
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
