/**
 * An access rule that determines who can view a piece of content.
 */
export interface AccessRule {
    /**
     * The type of access being granted.
     * @example tier
     * @example patron
     * @example public
     */
    access_rule_type: string
}
