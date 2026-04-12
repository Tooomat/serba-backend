export const errorUtils = {
    parseErrorOrigin: (err?: unknown): string | undefined => {
        const error = err instanceof Error ? err : undefined

        if (!error?.stack) {
            const stack = new Error().stack
            if (!stack) return undefined
            const lines = stack.split('\n')
            const relevantLine = lines.find(line =>
                line.includes('at ') &&
                !line.includes('node_modules') &&
                !line.includes('(node:') &&
                !line.includes('error.utils')
            )
            return relevantLine?.trim().replace('at ', '')
        }

        const lines = error.stack.split('\n')
        const relevantLine = lines.find(line =>
            line.includes('at ') &&
            !line.includes('node_modules') &&
            !line.includes('(node:')
        )

        // // Output: "AuthService.register (src/modules/auth/auth.service.ts:18:15)"
        return relevantLine?.trim().replace('at ', '')
    }
}