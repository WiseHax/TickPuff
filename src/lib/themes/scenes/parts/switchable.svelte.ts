/**
 * A scenery light that follows the time of day until the user clicks it;
 * after that it stays the way they left it (until the world is reopened).
 */
export function switchable(auto: () => boolean) {
  let manual = $state<boolean | null>(null);
  return {
    get on(): boolean {
      return manual ?? auto();
    },
    toggle(): void {
      manual = !(manual ?? auto());
    },
  };
}
