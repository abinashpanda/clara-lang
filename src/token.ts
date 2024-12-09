export const TOKENS = {
	SEMI: ';',
	COMMA: ',',
} as const

export type TokenType = keyof typeof TOKENS
