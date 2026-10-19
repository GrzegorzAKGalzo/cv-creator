/** "Buy me a coffee" button (buycoffee.to). Desktop: bottom-right corner; mobile: above the floating PDF button. */
export default function CoffeeWidget() {
  return (
    <a
      href="https://buycoffee.to/grzegorz-design"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+3.75rem)] z-30 block rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none lg:bottom-4"
    >
      <img
        src="https://buycoffee.to/static/img/share/share-button-primary--pl.png"
        alt="Postaw kawę dla Grzegorz Design na buycoffee.to"
        width={351}
        height={92}
        className="h-10 w-auto lg:h-[46px]"
      />
    </a>
  )
}
