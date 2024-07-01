/* eslint-disable jsdoc/require-jsdoc */
import { Project, type SourceFile, NewLineKind, ts } from 'ts-morph'

export interface TsScript {
    project: Project
    file: SourceFile
    save(): Promise<void>
    addVariableStatement: SourceFile['addVariableStatement']
}

export function createTsScriptProgram (outFilename: string): TsScript {
    const project = new Project({
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