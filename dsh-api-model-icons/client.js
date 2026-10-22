window.__ModuleLoader__.load({
  id: 'dsh-api-model-icons',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const SIZE = 14;
    const TILE = 16;
    const LABEL_STYLE = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      minWidth: 0,
      maxWidth: '100%',
      verticalAlign: 'middle',
    };
    const NAME_STYLE = {
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    };
    const ICON_STYLE = {
      display: 'inline-flex',
      flex: 'none',
      boxSizing: 'border-box',
      width: TILE + 'px',
      height: TILE + 'px',
      padding: '1px',
      borderRadius: '4px',
      background: '#FFFFFF',
      overflow: 'hidden',
    };
    const TAG_STYLE = {
      flex: 'none',
      padding: '0 4px',
      borderRadius: '4px',
      background: 'color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent)',
      color: 'var(--dsw-alias-brand-primary)',
      fontSize: '10px',
      fontWeight: 500,
      lineHeight: '14px',
      fontVariantNumeric: 'tabular-nums',
    };

    /**
     * Pick the artwork for one API provider. Known routes get a branded mark;
     * unknown routes fall back to a neutral globe so new providers still read
     * as an API source.
     * @param provider - Provider identity from the model-label owner props.
     * @returns the icon family key.
     */
    function iconKind(provider) {
      const id = provider && typeof provider.id === 'string' ? provider.id.toLowerCase() : '';
      const name = provider && typeof provider.name === 'string' ? provider.name.toLowerCase() : '';
      if (id.includes('deepseek') || name.includes('deepseek') || name.includes('深度求索')) return 'deepseek';
      if (id.includes('volcengine') || id.includes('doubao') || name.includes('volcengine') || name.includes('doubao') || name.includes('豆包') || name.includes('火山')) return 'doubao';
      if (id.includes('aliyun') || id.includes('bailian') || id.includes('qwen') || name.includes('aliyun') || name.includes('bailian') || name.includes('qwen') || name.includes('千问') || name.includes('通义')) return 'qwen';
      return 'generic';
    }

    /**
     * Official provider marks, reproduced from @lobehub/icons-static-svg
     * 1.97.0 (MIT-licensed icon set; the marks remain trademarks of their
     * owners and are used here only to identify the configured API route).
     */
    const LOGOS = {
      deepseek: {
        paths: [
          {
            key: 'mark',
            fill: '#4D6BFE',
            fillRule: 'evenodd',
            d: 'M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z',
          },
        ],
      },
      qwen: {
        paths: [
          {
            key: 'mark',
            fill: '#082DFF',
            d: 'M19.713 2.825h-5.907c0-.251-.066-.503-.196-.728L12.819.728A1.46 1.46 0 0 0 11.559 0h-1.58c-.52 0-1 .275-1.26.728l-2.42 4.19a1.45 1.45 0 0 0 0 1.453l.791 1.37c.26.448.74.727 1.26.727h11.36c.52 0 1-.275 1.26-.728l.79-1.37a1.45 1.45 0 0 0 0-1.451l-.79-1.37a1.46 1.46 0 0 0-1.26-.728zM.195 9.905l2.951 5.115a1.46 1.46 0 0 0-.531.531l-.791 1.37a1.45 1.45 0 0 0 0 1.452l.79 1.37c.26.448.74.727 1.26.727h4.84c.52 0 1-.275 1.26-.728l.79-1.37a1.45 1.45 0 0 0 0-1.451L5.086 7.083a1.46 1.46 0 0 0-1.26-.728h-1.58c-.52 0-1 .276-1.26.728l-.79 1.37a1.45 1.45 0 0 0 0 1.452m15.888 13.367 2.951-5.115c.217.125.469.196.728.196h1.582c.52 0 1-.275 1.26-.728l.79-1.37a1.45 1.45 0 0 0 0-1.451l-2.42-4.191a1.46 1.46 0 0 0-1.259-.728h-1.582c-.52 0-1 .276-1.259.728l-5.678 9.838a1.45 1.45 0 0 0 0 1.452l.79 1.37c.26.448.74.727 1.26.727h1.582c.52 0 1-.275 1.26-.728z',
          },
        ],
      },
      doubao: {
        paths: [
          {
            key: 'left',
            fill: '#1E37FC',
            d: 'M5.31 15.756c.172-3.75 1.883-5.999 2.549-6.739-3.26 2.058-5.425 5.658-6.358 8.308v1.12C1.501 21.513 4.226 24 7.59 24a6.59 6.59 0 002.2-.375c.353-.12.7-.248 1.039-.378.913-.899 1.65-1.91 2.243-2.992-4.877 2.431-7.974.072-7.763-4.5l.002.001z',
          },
          {
            key: 'right',
            fill: '#37E1BE',
            d: 'M22.57 10.283c-1.212-.901-4.109-2.404-7.397-2.8.295 3.792.093 8.766-2.1 12.773a12.782 12.782 0 01-2.244 2.992c3.764-1.448 6.746-3.457 8.596-5.219 2.82-2.683 3.353-5.178 3.361-6.66a2.737 2.737 0 00-.216-1.084v-.002z',
          },
          {
            key: 'top',
            fill: '#A569FF',
            d: 'M14.303 1.867C12.955.7 11.248 0 9.39 0 7.532 0 5.883.677 4.545 1.807 2.791 3.29 1.627 5.557 1.5 8.125v9.201c.932-2.65 3.097-6.25 6.357-8.307.5-.318 1.025-.595 1.569-.829 1.883-.801 3.878-.932 5.746-.706-.222-2.83-.718-5.002-.87-5.617h.001z',
          },
          {
            key: 'cap',
            fill: '#1E37FC',
            d: 'M17.305 4.961a199.47 199.47 0 01-1.08-1.094c-.202-.213-.398-.419-.586-.622l-1.333-1.378c.151.615.648 2.786.869 5.617 3.288.395 6.185 1.898 7.396 2.8-1.306-1.275-3.475-3.487-5.266-5.323z',
          },
        ],
      },
    };

    /** Neutral globe on the white tile for any other API route. */
    function genericShape() {
      return [
        h('circle', { key: 'globe', cx: 8, cy: 8, r: 5.6, fill: 'none', stroke: '#64748B', strokeWidth: 1.4 }),
        h('ellipse', { key: 'meridian', cx: 8, cy: 8, rx: 2.4, ry: 5.6, fill: 'none', stroke: '#64748B', strokeWidth: 1.2 }),
        h('path', { key: 'equator', d: 'M2.6 8h10.8', fill: 'none', stroke: '#64748B', strokeWidth: 1.2 }),
      ];
    }

    /**
     * Render the provider mark. The label text carries the meaning for assistive
     * technology, so the artwork itself stays hidden; the title only names the
     * API route on hover.
     * @param props - provider identity from the model-label owner props.
     * @returns the inline icon.
     */
    function ProviderIcon({ provider }) {
      const kind = iconKind(provider);
      const logo = LOGOS[kind];
      const shape = logo ? logo.paths.map((path) => h('path', path)) : genericShape();
      return h(
        'span',
        {
          style: ICON_STYLE,
          title: provider && typeof provider.name === 'string' ? provider.name : undefined,
          'aria-hidden': 'true',
        },
        h(
          'svg',
          {
            width: SIZE,
            height: SIZE,
            viewBox: logo ? '0 0 24 24' : '0 0 16 16',
            preserveAspectRatio: 'xMidYMid meet',
            focusable: 'false',
            'aria-hidden': 'true',
          },
          shape,
        ),
      );
    }

    /**
     * The shipped single-slot release marker from the 1017 label plugin is the
     * occupant this decoration shadows, so keep the same marker visible for the
     * exact route it was pinned to.
     * @param provider - provider identity.
     * @param model - model catalog entry.
     * @returns whether the fixed 1017 marker applies.
     */
    function isReleaseMarker(provider, model) {
      if (!provider || !model) return false;
      if (provider.id !== 'deepseek-official' && provider.id !== 'deepseek-account') return false;
      return model.id === 'deepseek-flash' && model.name === 'DeepSeek-V4.1-Flash';
    }

    /**
     * Render a model label as provider icon, catalog name, and any shipped
     * marker. The host supplies the same owner props for the trigger, the
     * current model cell, and each selectable model row.
     * @param props - provider, model, placement, and selection state.
     * @returns the decorated inline label.
     */
    function ApiModelLabel({ provider, model }) {
      const name = model && typeof model.name === 'string' ? model.name : model && typeof model.id === 'string' ? model.id : '';
      const children = [
        h(ProviderIcon, { key: 'icon', provider }),
        h('span', { key: 'name', style: NAME_STYLE }, name),
      ];
      if (isReleaseMarker(provider, model)) {
        children.push(h('span', { key: 'marker', style: TAG_STYLE }, '1017'));
      }
      return h('span', { style: LABEL_STYLE, 'data-api-model-icons': '1' }, children);
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.input.model.label', () =>
          ctx.slots.register(
            {
              name: 'conversation.input.model.label',
              // Lowest priority renders in a single slot; the shipped 1017 label
              // occupies the default priority 0.
              priority: -1,
            },
            ApiModelLabel,
          ),
        );
      },
    };
  },
});
