/* eslint-disable jsdoc/require-jsdoc */
import { readdir } from 'node:fs/promises'
import { parse, resolve } from 'node:path'

import { VariableDeclarationKind } from 'ts-morph'

import { Type } from '../../v2'

import { createTsScriptProgram, type TsScript } from './shared'

export async function syncResourceSchemas () {
    const program = createTsScriptProgram('schemas.ts')

    const files = await readdir(resolve('.', './src/schemas/v2/resources/'), { encoding: 'utf8' })
    const relationships = getRelationships(program)

    for (const file of files) {
        const sourceFile = program.project.addSourceFileAtPath('./src/schemas/v2/resources/' + file)
        const fileName = parse(file).name
        const type = <Type>(fileName === 'oauth_client' ? 'client' : fileName.replace('_', '-'))

        const name = snakeCaseToPascalCase(fileName)
        const resource = sourceFile.getInterfaceOrThrow(name)
        const properties = resource.getProperties().map(p => p.getName())

        program.addVariableStatement({
            declarationKind: VariableDeclarationKind.Const,
            isExported: true,
            declarations: [{
                name: name,
                initializer: writer => {
                    writer.block(() => {
                        writer.indent()
                        writer.write('resource: \'' + type + '\',')
                        writer.newLine()

                        writer.indent()
                        writer.write('properties: [')
                        for (const name of properties) {
                            writer.newLine()
                            writer.indent(2)
                            writer.write('\'' + name + '\',')
                        }
                        writer.newLine()
                        writer.write('],')

                        writer.newLine()
                        writer.indent()
                        writer.write('relationships: [')
                        for (const relation of relationships[type]) {
                            writer.newLine()
                            writer.indent(2)
                            writer.inlineBlock(() => {
                                writer.write(Object.entries(relation).reduce((str, item, i, items) => {
                                    return str + item[0] + ': \'' + item[1] + '\'' + (i !== items.length - 1 ? ', ' : '')
                                }, ''))
                            })
                            writer.write(',')
                        }

                        writer.newLine()
                        writer.write('],')
                    })
                }
            }]
        })

    }

    await program.save()
}

function snakeCaseToPascalCase(input: string): string {
    return input
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('')
}

function getRelationships (program: TsScript) {
    const source = program.project.addSourceFileAtPath('./src/schemas/v2/relationships.ts')

    const typeMap = source.getInterfaceOrThrow('RelationshipTypeMap')

    function formatProp (prop: ReturnType<NonNullable<(typeof typeMap)>['getType']>) {
        return prop.getProperties().reduce<{ resource: Type, name: string, type: 'array' | 'item' }[]>((props, child) => {
            const elements = child.getValueDeclarationOrThrow().getType().getTupleElements()
            const getElement = (index: number) => elements.at(index)?.getText() ?? ''

            const hasName = elements.length > 2
            const resource = <Type>child.getName()
            const name = hasName ? getElement(0).replaceAll('"', '') ?? '' : resource

            return props.concat({
                resource,
                name,
                type: getElement(hasName ? 1 : 0) === 'true' ? 'array' : 'item'
            })
        }, [])
    }

    return typeMap.getProperties().reduce<Record<Type, { resource: Type, name: string, type: 'array' | 'item' }[]>>((obj, prop) => ({
        ...obj,
        [<Type>prop.getName().replaceAll('\'', '')]: formatProp(prop.getType())
    }), <never>{})
}
