
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.28.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\AdvisorInformation.svelte generated by Svelte v3.28.0 */

    const file = "src\\components\\AdvisorInformation.svelte";

    function create_fragment(ctx) {
    	let div6;
    	let div4;
    	let div2;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div1;
    	let h3;
    	let t2;
    	let div0;
    	let h4;
    	let t4;
    	let label;
    	let input;
    	let t5;
    	let div3;
    	let img1;
    	let img1_src_value;
    	let t6;
    	let div5;
    	let h5;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			img0 = element("img");
    			t0 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Advisor Name";
    			t2 = space();
    			div0 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Available";
    			t4 = space();
    			label = element("label");
    			input = element("input");
    			t5 = space();
    			div3 = element("div");
    			img1 = element("img");
    			t6 = space();
    			div5 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Arriving Clients";
    			if (img0.src !== (img0_src_value = /*user_image*/ ctx[1])) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "user");
    			attr_dev(img0, "class", "svelte-14csmct");
    			add_location(img0, file, 64, 6, 1207);
    			add_location(h3, file, 66, 8, 1285);
    			add_location(h4, file, 68, 10, 1351);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "svelte-14csmct");
    			add_location(input, file, 69, 18, 1389);
    			add_location(label, file, 69, 10, 1381);
    			attr_dev(div0, "class", "available svelte-14csmct");
    			add_location(div0, file, 67, 8, 1316);
    			attr_dev(div1, "class", "information svelte-14csmct");
    			add_location(div1, file, 65, 6, 1250);
    			attr_dev(div2, "class", "user_information svelte-14csmct");
    			add_location(div2, file, 63, 4, 1169);
    			if (img1.src !== (img1_src_value = /*autonation_logo*/ ctx[2])) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "autonation logo");
    			attr_dev(img1, "class", "svelte-14csmct");
    			add_location(img1, file, 74, 6, 1527);
    			attr_dev(div3, "class", "logo_image svelte-14csmct");
    			add_location(div3, file, 73, 4, 1495);
    			attr_dev(div4, "class", "wrapper_top svelte-14csmct");
    			add_location(div4, file, 62, 2, 1138);
    			add_location(h5, file, 78, 4, 1638);
    			attr_dev(div5, "class", "wrapper_bottom svelte-14csmct");
    			add_location(div5, file, 77, 2, 1604);
    			attr_dev(div6, "class", "wrapper svelte-14csmct");
    			add_location(div6, file, 61, 0, 1113);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div4);
    			append_dev(div4, div2);
    			append_dev(div2, img0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h3);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, h4);
    			append_dev(div0, t4);
    			append_dev(div0, label);
    			append_dev(label, input);
    			input.checked = /*available*/ ctx[0];
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, img1);
    			append_dev(div6, t6);
    			append_dev(div6, div5);
    			append_dev(div5, h5);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*available*/ 1) {
    				input.checked = /*available*/ ctx[0];
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AdvisorInformation", slots, []);
    	let user_image = "images/user.png";
    	let autonation_logo = "images/autonation_logo.png";
    	let available = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AdvisorInformation> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		available = this.checked;
    		$$invalidate(0, available);
    	}

    	$$self.$capture_state = () => ({ user_image, autonation_logo, available });

    	$$self.$inject_state = $$props => {
    		if ("user_image" in $$props) $$invalidate(1, user_image = $$props.user_image);
    		if ("autonation_logo" in $$props) $$invalidate(2, autonation_logo = $$props.autonation_logo);
    		if ("available" in $$props) $$invalidate(0, available = $$props.available);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [available, user_image, autonation_logo, input_change_handler];
    }

    class AdvisorInformation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AdvisorInformation",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\components\ClientInf.svelte generated by Svelte v3.28.0 */

    const file$1 = "src\\components\\ClientInf.svelte";

    function create_fragment$1(ctx) {
    	let div3;
    	let div0;
    	let h3;
    	let t0;
    	let t1;
    	let span0;
    	let stron;
    	let t3;
    	let t4;
    	let t5;
    	let button;
    	let t7;
    	let div1;
    	let t8;
    	let div2;
    	let h4;
    	let t10;
    	let span1;
    	let t11;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			t0 = text(/*name*/ ctx[0]);
    			t1 = space();
    			span0 = element("span");
    			stron = element("stron");
    			stron.textContent = "License Plate:";
    			t3 = space();
    			t4 = text(/*plate*/ ctx[1]);
    			t5 = space();
    			button = element("button");
    			button.textContent = "Attend Now";
    			t7 = space();
    			div1 = element("div");
    			t8 = space();
    			div2 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Recent History";
    			t10 = space();
    			span1 = element("span");
    			t11 = text(/*history*/ ctx[2]);
    			add_location(h3, file$1, 60, 4, 940);
    			add_location(stron, file$1, 61, 10, 967);
    			attr_dev(span0, "class", "svelte-xwe9o1");
    			add_location(span0, file$1, 61, 4, 961);
    			attr_dev(button, "class", "svelte-xwe9o1");
    			add_location(button, file$1, 63, 4, 1024);
    			attr_dev(div0, "class", "left svelte-xwe9o1");
    			add_location(div0, file$1, 59, 2, 916);
    			attr_dev(div1, "class", "line svelte-xwe9o1");
    			add_location(div1, file$1, 65, 2, 1065);
    			add_location(h4, file$1, 67, 4, 1113);
    			attr_dev(span1, "class", "svelte-xwe9o1");
    			add_location(span1, file$1, 68, 4, 1142);
    			attr_dev(div2, "class", "right svelte-xwe9o1");
    			add_location(div2, file$1, 66, 2, 1088);
    			attr_dev(div3, "class", "wrapper svelte-xwe9o1");
    			add_location(div3, file$1, 58, 0, 891);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, h3);
    			append_dev(h3, t0);
    			append_dev(div0, t1);
    			append_dev(div0, span0);
    			append_dev(span0, stron);
    			append_dev(span0, t3);
    			append_dev(span0, t4);
    			append_dev(div0, t5);
    			append_dev(div0, button);
    			append_dev(div3, t7);
    			append_dev(div3, div1);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			append_dev(div2, h4);
    			append_dev(div2, t10);
    			append_dev(div2, span1);
    			append_dev(span1, t11);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t0, /*name*/ ctx[0]);
    			if (dirty & /*plate*/ 2) set_data_dev(t4, /*plate*/ ctx[1]);
    			if (dirty & /*history*/ 4) set_data_dev(t11, /*history*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ClientInf", slots, []);
    	let { name } = $$props;
    	let { plate } = $$props;
    	let { history } = $$props;
    	const writable_props = ["name", "plate", "history"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ClientInf> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("plate" in $$props) $$invalidate(1, plate = $$props.plate);
    		if ("history" in $$props) $$invalidate(2, history = $$props.history);
    	};

    	$$self.$capture_state = () => ({ name, plate, history });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("plate" in $$props) $$invalidate(1, plate = $$props.plate);
    		if ("history" in $$props) $$invalidate(2, history = $$props.history);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, plate, history];
    }

    class ClientInf extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { name: 0, plate: 1, history: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ClientInf",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<ClientInf> was created without expected prop 'name'");
    		}

    		if (/*plate*/ ctx[1] === undefined && !("plate" in props)) {
    			console.warn("<ClientInf> was created without expected prop 'plate'");
    		}

    		if (/*history*/ ctx[2] === undefined && !("history" in props)) {
    			console.warn("<ClientInf> was created without expected prop 'history'");
    		}
    	}

    	get name() {
    		throw new Error("<ClientInf>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<ClientInf>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get plate() {
    		throw new Error("<ClientInf>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set plate(value) {
    		throw new Error("<ClientInf>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get history() {
    		throw new Error("<ClientInf>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set history(value) {
    		throw new Error("<ClientInf>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ArrivingClients.svelte generated by Svelte v3.28.0 */
    const file$2 = "src\\components\\ArrivingClients.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let clientinf0;
    	let t0;
    	let clientinf1;
    	let t1;
    	let clientinf2;
    	let current;

    	clientinf0 = new ClientInf({
    			props: {
    				name: "Damian Marley",
    				plate: "KGZ-A53",
    				history: "Traded a Subaru for a FerrariPerformed Engine Replacement"
    			},
    			$$inline: true
    		});

    	clientinf1 = new ClientInf({
    			props: {
    				name: "Tim Cook",
    				plate: "AFW-G53",
    				history: "Traded a Corolla for a PorscheRequested a Refund for his Corolla"
    			},
    			$$inline: true
    		});

    	clientinf2 = new ClientInf({
    			props: {
    				name: "Percy Jackson",
    				plate: "AFW-G53",
    				history: "Is pro"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(clientinf0.$$.fragment);
    			t0 = space();
    			create_component(clientinf1.$$.fragment);
    			t1 = space();
    			create_component(clientinf2.$$.fragment);
    			attr_dev(div, "class", "wrapper svelte-7o05le");
    			add_location(div, file$2, 11, 2, 161);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(clientinf0, div, null);
    			append_dev(div, t0);
    			mount_component(clientinf1, div, null);
    			append_dev(div, t1);
    			mount_component(clientinf2, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(clientinf0.$$.fragment, local);
    			transition_in(clientinf1.$$.fragment, local);
    			transition_in(clientinf2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(clientinf0.$$.fragment, local);
    			transition_out(clientinf1.$$.fragment, local);
    			transition_out(clientinf2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(clientinf0);
    			destroy_component(clientinf1);
    			destroy_component(clientinf2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ArrivingClients", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ArrivingClients> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ClientInf });
    	return [];
    }

    class ArrivingClients extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ArrivingClients",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.28.0 */
    const file$3 = "src\\App.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let advisorinformation;
    	let t;
    	let arrivingclients;
    	let current;
    	advisorinformation = new AdvisorInformation({ $$inline: true });
    	arrivingclients = new ArrivingClients({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(advisorinformation.$$.fragment);
    			t = space();
    			create_component(arrivingclients.$$.fragment);
    			attr_dev(main, "class", "svelte-1fwzgbw");
    			add_location(main, file$3, 13, 0, 275);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(advisorinformation, main, null);
    			append_dev(main, t);
    			mount_component(arrivingclients, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(advisorinformation.$$.fragment, local);
    			transition_in(arrivingclients.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(advisorinformation.$$.fragment, local);
    			transition_out(arrivingclients.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(advisorinformation);
    			destroy_component(arrivingclients);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ AdvisorInformation, ArrivingClients });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
