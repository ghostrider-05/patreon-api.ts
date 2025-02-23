/* eslint-disable jsdoc/require-jsdoc */
import { readdir } from 'node:fs/promises'
import { parse, resolve } from 'node:path'

import { MethodDeclarationStructure, OptionalKind } from 'ts-morph'

import { Type } from '../../v2'

import { createTsScriptProgram, getJsDocTags } from './shared'

export async function syncRandomData () {
    const program = createTsScriptProgram('random.ts')

    const files = await readdir(resolve('.', './src/schemas/v2/resources/'), { encoding: 'utf8' })
    // const relationships = getRelationships(program)

    const methods: OptionalKind<MethodDeclarationStructure>[] = []

    for (const file of files) {
        const sourceFile = program.project.addSourceFileAtPath('./src/schemas/v2/resources/' + file)
        const fileName = parse(file).name
        const type = <Type>(fileName === 'oauth_client' ? 'client' : fileName.replace('_', '-'))

        const name = snakeCaseToPascalCase(fileName)
        const resource = sourceFile.getInterfaceOrThrow(name)
        const properties = resource.getProperties()

        methods.push({
            name: type.includes('-') ? `'${type}'` : type,
            parameters: [{
                name: 'id',
                type: 'string',
            }],
            docs: getJsDocTags(resource, 'deprecated')?.length
                ? [{ tags: [{ tagName: 'deprecated' }]}]
                : [],
            returnType: `ItemMap['${type}']`,
            statements: writer => {
                writer.write('return {')
                writer.newLine()

                for (const property of properties) {
                    writer.indent()

                    if (getJsDocTags(property, 'deprecated')?.length) {
                        writer.write('/** @deprecated */')
                        writer.newLine()
                        writer.indent()
                    }

                    writer.write(property.getName() + ':')
                    writer.space()

                    const generator = getGeneratorFromName(property.getName())
                        ?? getGeneratorFromFormat(property.getName(), getJsDocTags(property, 'format')?.at(0))
                    const exampleValue = getJsDocTags(property, 'example')?.at(0)
                    const propType = property.getType()

                    if (generator) writer.write(`this.random.${generator}()`)
                    else if (exampleValue) writer.write(exampleValue)
                    else if (!propType.isNullable() && (propType.isBoolean() || propType.isNumber())) {
                        writer.write(`this.random.${propType.getText()}()`)
                    }
                    else if (propType.getText() === 'object') {
                        writer.write('{}')
                    }
                    else if (propType.isUnion() && propType.getUnionTypes().some(u => u.isLiteral())) {
                        writer.write(`this.random.arrayElement([${propType.getUnionTypes().reduce((str, un) => str + (str.length === 0 ? '' : ', ') + un.getText().replace(/"/g, '\''), '')}])`)
                    }
                    else if (propType.getText() === 'string' && !propType.isNullable()) {
                        writer.write('\'\'')
                    }
                    else writer.write('null')

                    writer.write(',')
                    writer.newLine()
                }

                writer.indent()
                writer.write(`...(this.resources?.${type.includes('-') ? `['${type}']` : type}?.(id) ?? {}),`)

                writer.write('}')
            },
        })
    }

    program.file.addImportDeclaration({
        moduleSpecifier: '../item',
        namedImports: ['ItemMap'],
        isTypeOnly: true,
        leadingTrivia: writer => {
            writer.write('/* eslint-disable jsdoc/require-param */')
            writer.newLine()
            writer.write('/* eslint-disable jsdoc/require-returns */')
            writer.newLine()
        }
    })

    program.file.addImportDeclaration({
        moduleSpecifier: '../mock/random',
        namedImports: ['RandomDataGenerator'],
        isTypeOnly: true,
    })

    program.file.addClass({
        isDefaultExport: true,
        name: 'RandomDataResources',
        methods,
        ctors: [{
            leadingTrivia: 'public ',
            parameters: [
                {
                    name: 'random',
                    leadingTrivia: writer => {
                        writer.newLine()
                        writer.write('public')
                        writer.space()
                    },
                    hasQuestionToken: false,
                    type: 'RandomDataGenerator',
                    trailingTrivia: ',',
                },
                {
                    name: 'resources',
                    leadingTrivia: writer => {
                        writer.newLine()
                        writer.write('public')
                        writer.space()
                    },
                    hasQuestionToken: true,
                    type: 'Partial<{ [T in keyof ItemMap]: (id: string) => Partial<ItemMap[T]> }>',
                    trailingTrivia: ',',
                }
            ]
        }]
    })

    await program.save()
}

function snakeCaseToPascalCase(input: string): string {
    return input
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('')
}

function getGeneratorFromName (name: string) {
    switch (name) {
    case 'country':
        return 'countryCode'
    case 'state':
        return 'state'
    case 'city':
        return 'city'
    case 'phone_number':
        return 'phonenumber'
    case 'email':
        return 'email'
    case 'first_name':
        return 'firstName'
    case 'last_name':
        return 'lastName'
    case 'full_name':
        return 'fullName'
    case 'currency_code':
        return 'currencyCode'
    case 'title':
        return 'title'
    case 'description':
        return 'description'
    default:
        return undefined
    }
}

function getGeneratorFromFormat (name: string, format: string | undefined) {
    switch (format) {
    case 'uri':
        return name.startsWith('image') || name.startsWith('thumb')
            ? 'imageUri'
            : (name.includes('video') ? 'videoUri' : 'uri')
    case 'date-time':
        return [
            'created',
            'edited',
            'last_attempted',
            'published',
            'completed'
        ].some(prefix => name.startsWith(prefix)) ? 'pastDate' : 'futureDate'
    default:
        return undefined
    }
}
