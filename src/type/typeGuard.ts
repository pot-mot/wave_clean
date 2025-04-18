export const isSymbol = (arg: any): arg is symbol => {
    return typeof arg === 'symbol';
}
