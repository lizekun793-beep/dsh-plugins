/**
 * Browser half of the image-generation bundle.
 *
 * Registers the configuration page shown on the Plugins page for this
 * bundle's `image-gen` row. The page edits the three volatile Config fields
 * (`baseURL`, `model`, `apiKey`) through the shared settings form service, so
 * a save needs no restart and refresh of the tool configuration is immediate.
 */
window.__ModuleLoader__.load({
	id: '@local/image-gen',
	factory(require) {
		const React = require('react');
		const h = React.createElement;

		/** Dictionary namespace owned by this plugin. */
		const NS = 'imageGen';

		/** The Host settings namespace, which is the patch row id. */
		const SETTINGS_NS = 'image-gen';

		/** Keyed slot entry key on the Plugins page. */
		const ROW_KEY = '@local/image-gen#image-gen';

		const en = {
			summary: 'Configure the image API endpoint, model, and key.',
			intro: 'Generates images through an OpenAI-compatible images endpoint (POST https://<host>/v1/images/generations). The agent calls it as the generate_image tool.',
			baseURL: 'API base URL',
			baseURLHint: 'For example https://api.openai.com/v1. The /images/generations path is appended automatically, unless the URL already ends with it.',
			model: 'Model',
			modelHint: 'The model name the endpoint expects, for example gpt-image-1, dall-e-3, or a provider-specific image model.',
			apiKey: 'API key',
			apiKeyHint: 'Sent as Authorization: Bearer. Leave empty only when the endpoint accepts unauthenticated requests.',
			show: 'Show',
			hide: 'Hide',
			save: 'Save',
			saving: 'Saving…',
			saved: 'Saved.',
			refused: 'The save was refused; the values were probably changed elsewhere. The latest values are shown.',
			failed: 'Save failed: ',
			loading: 'Loading configuration…',
			unavailable: 'This plugin configuration is not available to this page.',
			note: 'The key is stored in this profile’s plugin configuration. After saving, the generate_image tool uses the new values immediately.',
			required: 'Fill this in before generating images.',
		};

		const zh = {
			summary: '配置生图接口地址、模型和 Key。',
			intro: '通过兼容 OpenAI 的图片生成接口出图（POST https://<host>/v1/images/generations），供 Agent 调用 generate_image 工具。',
			baseURL: '接口地址（Base URL）',
			baseURLHint: '例如 https://api.openai.com/v1。插件会自动补上 /images/generations；如果地址本身已包含该路径，则按原样使用。',
			model: '模型',
			modelHint: '接口要求的模型名，例如 gpt-image-1、dall-e-3，或服务商自己的生图模型名。',
			apiKey: 'API Key',
			apiKeyHint: '以 Authorization: Bearer 方式发送。仅当接口允许匿名调用时留空。',
			show: '显示',
			hide: '隐藏',
			save: '保存',
			saving: '正在保存…',
			saved: '已保存。',
			refused: '保存被拒绝：配置可能已在别处更新，已显示最新值。',
			failed: '保存失败：',
			loading: '正在读取配置…',
			unavailable: '当前页面无法访问该插件配置。',
			note: 'Key 会保存在当前 profile 的插件配置中。保存后 generate_image 工具立即使用新值。',
			required: '使用生图前请先填写。',
		};

		const CSS = `
.dsh-ig-form { display: flex; flex-direction: column; gap: 16px; max-width: 560px; }
.dsh-ig-intro { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }
.dsh-ig-field { display: flex; flex-direction: column; gap: 6px; }
.dsh-ig-label { color: var(--dsw-alias-label-primary); font-size: 13px; font-weight: 500; line-height: 20px; }
.dsh-ig-input { box-sizing: border-box; width: 100%; height: 40px; padding: 0 12px; border: .5px solid var(--dsw-alias-border-l4); border-radius: var(--dsw-radius-md); background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; outline: none; }
.dsh-ig-input:focus { border-color: var(--dsw-alias-state-business-primary); box-shadow: inset 0 0 0 .5px var(--dsw-alias-state-business-primary); }
.dsh-ig-input:disabled { opacity: .6; }
.dsh-ig-keyrow { display: flex; gap: 8px; align-items: center; }
.dsh-ig-reveal { flex: none; height: 40px; padding: 0 12px; border: .5px solid var(--dsw-alias-border-l4); border-radius: var(--dsw-radius-md); background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12.5px; cursor: pointer; }
.dsh-ig-reveal:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.dsh-ig-reveal:disabled { opacity: .5; cursor: default; }
.dsh-ig-hint { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
.dsh-ig-actions { display: flex; align-items: center; gap: 12px; }
.dsh-ig-save { height: 32px; padding: 0 16px; border: 0; border-radius: var(--dsw-radius-md); background: var(--dsw-alias-state-business-primary); color: var(--dsw-alias-label-primary-foreground); font: inherit; font-size: 13px; cursor: pointer; }
.dsh-ig-save:disabled { opacity: .5; cursor: default; }
.dsh-ig-status { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
.dsh-ig-status[data-tone="ok"] { color: var(--dsw-alias-state-success-primary); }
.dsh-ig-status[data-tone="error"] { color: var(--dsw-alias-state-error-primary); }
.dsh-ig-note { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
`;

		/** Append this page's stylesheet once; returns its cleanup. */
		function installStyles() {
			const id = 'image-gen-plugin-style';
			if (document.querySelector(`style[data-image-gen="${id}"]`) !== null) return () => {};
			const tag = document.createElement('style');
			tag.dataset.imageGen = id;
			tag.textContent = CSS;
			document.head.appendChild(tag);
			return () => {
				tag.remove();
			};
		}

		/** Fields the form edits, in display order. */
		const FIELDS = ['baseURL', 'model', 'apiKey'];

		/** Copy the editable fields out of a form snapshot. */
		function seed(value) {
			const source = value !== null && typeof value === 'object' ? value : {};
			const draft = {};
			for (const field of FIELDS) draft[field] = typeof source[field] === 'string' ? source[field] : '';
			return draft;
		}

		/** One labeled text field with an optional trailing control. */
		function Field(props) {
			return h(
				'label',
				{ className: 'dsh-ig-field', htmlFor: props.id },
				h('span', { className: 'dsh-ig-label' }, props.label),
				props.control,
				h('span', { className: 'dsh-ig-hint' }, props.hint),
			);
		}

		/** Pick the one-liner or the configuration form for the row page. */
		function ImageGenConfig(props) {
			if (props.view === 'summary') return props.t('summary');
			return h(ImageGenForm, props);
		}

		/** The row configuration form. */
		function ImageGenForm(props) {
			const { t, scope } = props;
			const subscribe = React.useCallback((listener) => scope.subscribe(listener), [scope]);
			const getSnapshot = React.useCallback(() => scope.getSnapshot(), [scope]);
			const snapshot = React.useSyncExternalStore(subscribe, getSnapshot);
			const value = snapshot.value !== null && typeof snapshot.value === 'object' ? snapshot.value : {};
			const [draft, setDraft] = React.useState(() => seed(value));
			const [dirty, setDirty] = React.useState(false);
			const [phase, setPhase] = React.useState('idle');
			const [error, setError] = React.useState('');
			const [reveal, setReveal] = React.useState(false);
			const revision = snapshot.revision;
			const status = snapshot.status;

			React.useEffect(() => {
				if (dirty) return;
				setDraft(seed(value));
			}, [revision, status]);

			const ready = status === 'ready' && snapshot.writable === true;
			const busy = phase === 'saving';
			const disabled = !ready || busy;

			const edit = (field) => (event) => {
				const next = event.target.value;
				setDraft((current) => ({ ...current, [field]: next }));
				setDirty(true);
				setPhase('idle');
				setError('');
			};

			const save = () => {
				if (!ready || busy) return;
				const current = seed(value);
				const next = seed(draft);
				const ops = [];
				for (const field of FIELDS) {
					const valueNext = next[field].trim();
					if (valueNext !== (current[field] ?? '').trim()) ops.push({ op: 'set', path: [field], value: valueNext });
				}
				if (ops.length === 0) {
					setDirty(false);
					setPhase('saved');
					return;
				}
				setPhase('saving');
				setError('');
				Promise.resolve(scope.mutate(ops, snapshot.revision)).then(
					(accepted) => {
						setDirty(false);
						setPhase(accepted ? 'saved' : 'refused');
					},
					(cause) => {
						setPhase('failed');
						setError(cause !== null && typeof cause === 'object' && typeof cause.message === 'string' ? cause.message : String(cause));
					},
				);
			};

			const statusText =
				phase === 'saving'
					? t('saving')
					: phase === 'saved'
						? t('saved')
						: phase === 'refused'
							? t('refused')
							: phase === 'failed'
								? `${t('failed')}${error}`
								: '';
			const tone = phase === 'saved' ? 'ok' : phase === 'refused' || phase === 'failed' ? 'error' : '';

			const baseURL = Field({
				id: 'plugin-config-image-gen-base-url',
				label: t('baseURL'),
				control: h('input', {
					id: 'plugin-config-image-gen-base-url',
					className: 'dsh-ig-input',
					type: 'text',
					value: draft.baseURL,
					placeholder: 'https://api.openai.com/v1',
					spellCheck: false,
					autoComplete: 'off',
					disabled,
					onChange: edit('baseURL'),
				}),
				hint: t('baseURLHint'),
			});

			const model = Field({
				id: 'plugin-config-image-gen-model',
				label: t('model'),
				control: h('input', {
					id: 'plugin-config-image-gen-model',
					className: 'dsh-ig-input',
					type: 'text',
					value: draft.model,
					placeholder: 'gpt-image-1',
					spellCheck: false,
					autoComplete: 'off',
					disabled,
					onChange: edit('model'),
				}),
				hint: t('modelHint'),
			});

			const apiKey = Field({
				id: 'plugin-config-image-gen-key',
				label: t('apiKey'),
				control: h(
					'div',
					{ className: 'dsh-ig-keyrow' },
					h('input', {
						id: 'plugin-config-image-gen-key',
						className: 'dsh-ig-input',
						type: reveal ? 'text' : 'password',
						value: draft.apiKey,
						placeholder: 'sk-…',
						spellCheck: false,
						autoComplete: 'off',
						disabled,
						onChange: edit('apiKey'),
					}),
					h(
						'button',
						{
							type: 'button',
							className: 'dsh-ig-reveal',
							disabled,
							onClick: () => setReveal((current) => !current),
						},
						reveal ? t('hide') : t('show'),
					),
				),
				hint: t('apiKeyHint'),
			});

			return h(
				'div',
				{ className: 'dsh-ig-form' },
				h('p', { className: 'dsh-ig-intro' }, t('intro')),
				status === 'loading' ? h('p', { className: 'dsh-ig-status' }, t('loading')) : null,
				status === 'unavailable' ? h('p', { className: 'dsh-ig-status', 'data-tone': 'error', role: 'alert' }, t('unavailable')) : null,
				status === 'ready'
					? h(
							'section',
							{ style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
							baseURL,
							model,
							apiKey,
							h(
								'div',
								{ className: 'dsh-ig-actions' },
								h(
									'button',
									{
										type: 'button',
										className: 'dsh-ig-save',
										disabled: disabled,
										onClick: save,
									},
									phase === 'saving' ? t('saving') : t('save'),
								),
								statusText === '' ? null : h('p', { className: 'dsh-ig-status', 'data-tone': tone, role: 'status' }, statusText),
							),
						)
					: null,
				h('p', { className: 'dsh-ig-note' }, t('note')),
			);
		}

		return {
			inject: ['slots', 'locale', 'configForms'],
			apply(ctx) {
				ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'image-gen: dictionaries');
				ctx.effect(() => installStyles(), 'image-gen: styles');
				const scope = ctx.configForms.get(SETTINGS_NS);
				ctx.slots.inject('plugins.row.config', () =>
					ctx.slots.register(
						{
							name: 'plugins.row.config',
							key: ROW_KEY,
							locale: NS,
							inject: () => ({ scope }),
						},
						ImageGenConfig,
					),
				);
			},
		};
	},
});
