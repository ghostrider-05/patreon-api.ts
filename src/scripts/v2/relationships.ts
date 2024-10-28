/* eslint-disable jsdoc/require-jsdoc */
import { VariableDeclarationKind } from 'ts-morph'
import { createTsScriptProgram } from './shared'

interface RelationshipValue {
    resourceKey: string
    includeKey: string
    isArray: boolean
    isRelated: boolean
}

/** @deprecated */
export async function syncRelationships () {
    const program = createTsScriptProgram('relationships.ts')

    const source = program.project.addSourceFileAtPath('./src/schemas/v2/relationships.ts')

    const typeMap = source.getInterface('RelationshipTypeMap')
    if (!typeMap) throw new Error()

    function formatProp (prop: ReturnType<NonNullable<(typeof typeMap)>['getType']>) {
        return prop.getProperties().reduce((props, child) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const elements = child.getValueDeclaration()!.getType().getTupleElements()
            const getElement = (index: number) => elements.at(index)?.getText() ?? ''

            const hasName = elements.length > 2
            const resourceKey = child.getName()
            const includeKey = hasName ? getElement(0).replaceAll('"', '') ?? '' : resourceKey
            const isArray = getElement(hasName ? 1 : 0) === 'true'
            const isRelated = getElement(hasName ? 2 : 1) === 'true'

            return props.concat([{
                resourceKey,
                includeKey,
                isArray,
                isRelated,
            } satisfies RelationshipValue])
        }, <RelationshipValue[]>[])
    }

    const properties = typeMap.getProperties().reduce((obj, prop) => ({
        ...obj,
        [prop.getName().replaceAll('\'', '')]: formatProp(prop.getType())
    }), {})

    program.file.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        docs: [
            {
                tags: [{ tagName: 'deprecated' }],
            }
        ],
        declarations: [{
            name: 'SchemaRelationshipKeys',
            initializer: writer =>
                writer.write(
                    JSON.stringify(properties, null, 4)
                        .replaceAll('"', '\'')
                )
        }]
    })

    await program.save()
}
