import { cn } from '../lib/cn';

/**
 * A sign-in provider's own brand mark, served as a static file.
 *
 * Deliberately NOT an icon-font glyph or a Phosphor icon: the brand guidelines
 * require each company's own artwork, and a monochrome stand-in is both
 * off-brand and harder to recognise at a glance — the mark is what users scan
 * for, not the word.
 *
 * Static files rather than inlined JSX so a brand refresh is a file swap, the
 * markup stays out of the JS bundle, and the browser caches each mark once
 * across every screen that shows it (login, register, settings).
 *
 * Rendered with `aria-hidden`: the button's own text already says "Login with
 * Google", so announcing the logo as well would read the provider twice to a
 * screen reader.
 */
export type Provider = 'google' | 'apple';

/**
 * `monochrome` is not a style preference — it decides how the file can be
 * drawn, so the two kinds of mark cannot share one render path:
 *
 *   - Google's G is fixed multi-colour artwork. Recolouring it is a brand
 *     violation, so it renders as a plain <img> and is left exactly as shipped.
 *   - Apple's mark is a single silhouette that MUST be black on light and white
 *     on dark. Its source says `fill="currentColor"`, but inside an <img> that
 *     resolves against the image's own document — which has no inherited colour
 *     — so it would paint black in both themes and disappear against this app's
 *     dark surface (#0f1011).
 *
 * So a monochrome mark is painted as a CSS mask over `bg-current` instead: the
 * file supplies only the silhouette and the colour comes from the surrounding
 * text, which already flips with the theme. Same static file, correct in both.
 */
const marks: Record<Provider, { file: string; monochrome: boolean }> = {
	google: { file: '/brand/google.svg', monochrome: false },
	apple: { file: '/brand/apple.svg', monochrome: true },
};

export function ProviderIcon({
	provider,
	className = 'h-5 w-5',
}: {
	provider: Provider;
	className?: string;
}) {
	const mark = marks[provider];

	if (!mark.monochrome) {
		return <img src={mark.file} alt="" aria-hidden="true" className={cn('shrink-0', className)} />;
	}

	// -webkit- prefixes retained: Safari still ships masking unprefixed only
	// behind a flag, and Safari is exactly where the Apple button matters most.
	return (
		<span
			aria-hidden="true"
			className={cn('inline-block shrink-0 bg-current', className)}
			style={{
				maskImage: `url(${mark.file})`,
				WebkitMaskImage: `url(${mark.file})`,
				maskSize: 'contain',
				WebkitMaskSize: 'contain',
				maskRepeat: 'no-repeat',
				WebkitMaskRepeat: 'no-repeat',
				maskPosition: 'center',
				WebkitMaskPosition: 'center',
			}}
		/>
	);
}
