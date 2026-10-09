<script lang="ts">
	import { toastState } from '#lib/toast.svelte.ts';
</script>

<div class="toast" class:show={toastState.show}>{toastState.msg}</div>
