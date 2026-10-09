export const toastState = $state({ msg: '', show: false });

let timer: ReturnType<typeof setTimeout>;

export function toast(msg: string) {
	toastState.msg = msg;
	toastState.show = true;
	clearTimeout(timer);
	timer = setTimeout(() => (toastState.show = false), 1800);
}
