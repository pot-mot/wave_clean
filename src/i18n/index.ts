type BaseLocale = { [key: string]: string | ((...args: any[]) => string) }

type MainLocale = {

} & BaseLocale

type LocaleKey<
    Locale extends BaseLocale = MainLocale
> =
    string & keyof Locale

type LocaleKeyWithArgs<
    Locale extends BaseLocale = MainLocale,
    K extends string & keyof Locale = LocaleKey<Locale>,
    V extends Locale[K] = Locale[K]
> =
    { key: K, args: V extends (...args: infer A) => string ? A : [] }

type LocalKeyParam<
    Locale extends BaseLocale
> = LocaleKey<Locale> | LocaleKeyWithArgs<Locale>

export type MainLocaleKeyParam = LocalKeyParam<MainLocale>

export type ProjectLocale = MainLocale & {

}

export type ProjectLocaleKeyParam = LocalKeyParam<ProjectLocale>
