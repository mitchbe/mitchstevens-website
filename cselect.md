
Cybernetics, as developed by W. Ross Ashby and others, is often presented in terms of systems, feedback loops, and control mechanisms. Central to this tradition is the distinction between “trivial” and “non-trivial” machines, where a trivial machine maps input to output via a fixed function, and a non-trivial machine introduces internal state, rendering behavior dependent on history.

## 1. Trivial Machines as Idealizations

The distinction between “trivial” and “non-trivial” machines, as framed in cybernetics by W. Ross Ashby and Heinz von Foerster, is clear in definition, but a cleaner formulation may be possible.

At face value, the idea is straightforward. A “trivial machine” is one where a given input produces a predictable output—essentially, a stable input–output relation. A “non-trivial machine” is one where the output depends not only on the input, but also on internal state.

The problem is that no real system is actually trivial — triviality is something the observer assumes by selecting a stable relation and ignoring everything else. This is a sound basis for reasoning, but it must be understood as an abstraction, not a property of the system itself.

A ripple adder makes this concrete.

At the level of reasoning, we describe it with the relation:

```text
A = B + C
```

This is what cybernetics would call a “trivial machine”: a stable mapping from inputs to outputs. It is a **constraint we assume holds**, and from which we derive further reasoning.

But the physical ripple adder is not that relation.

It is a chain of gates whose behavior depends on, for example:

- voltage levels  
- temperature  
- non-physical interference

In other words, it is a **stateful, embedded process**. By any literal reading, it is a non-trivial machine.

The only reason we can treat it as “trivial” is that we have engineered it so that, within certain bounds, the relation `A = B + C` remains statistically stable. The trivial description is therefore not describing the machine—it is describing a **selected invariant we expect the machine to satisfy**.

This is the key point:

> The “trivial machine” is not the implementation. It is a constraint we reason with.

All reasoning derived from `A = B + C` is valid only insofar as the physical system continues to satisfy that constraint. When the underlying conditions drift—noise, thermal effects, timing violations—the relation breaks, and the reasoning no longer applies.

So in practice:

- the ripple adder is a non-trivial physical system  
- we reason about it using a trivial relation  
- the validity of that reasoning depends on the stability of the underlying conditions  

This exposes the issue with the terminology.

Calling `A = B + C` a “machine” conflates:

- an **abstract relation** (a constraint over values)  
- with a **physical system** (a stateful process in the world)


## 2. Relations as Selected Invariants

The former is a model used for reasoning. The latter is an implementation that may or may not satisfy that model.

In that sense, the trivial/non-trivial machine dichotomy is not really a classification of machines at all. It is a distinction between:

- relations that are fully captured by the observer’s selection  
- and relations that are only partially captured, with hidden or evolving state  

Framed as a distinction between machines, it becomes a category error.

The distinction between “trivial” and “non-trivial” machines can therefore be restated without appealing to machines at all.

What is called a “trivial machine” is not a property of a system, but a relation selected by an observer and assumed to hold. It is a constraint over possible values — for example, A = B + C — that remains stable enough to support reasoning. The physical system is then treated as if it instantiates that relation, so long as the conditions required for its stability are maintained.

This suggests a clearer formulation:

A “trivial machine” is not a machine, but a **selected invariant** — a relation over a system that has been isolated for the purpose of reasoning and treated as if it remains stable.

This selection can be understood as a **selector**: a relation that filters the behavior of a system down to those configurations that satisfy the constraint. In the case of `A = B + C`, the selector isolates only those states of the system consistent with addition.

The crucial step is **idealization**. The selected relation is not merely identified, but assumed to hold, allowing reasoning to proceed within its bounds.

The physical system is then treated as if it instantiates this relation, so long as the conditions required for its stability are maintained.

All reasoning proceeds within this assumption. When the underlying conditions drift beyond the bounds in which the relation holds, the invariant breaks, and the reasoning derived from it ceases to apply.

On this view, the machine itself is never trivial. Only the relation we select from it is.

## 3. From Single Invariants to Extended Relations

The formulation developed above assumes that the behaviour of interest can be captured by a single invariant — a relation over a fixed set of variables. In such cases, the same input yields the same output, and reasoning can proceed entirely within that constraint.

In cybernetics, this distinction is formalised by contrasting “trivial” and “non-trivial” machines. A trivial machine is described by a relation of the form `y = f(x)`, while a non-trivial machine is described by a relation of the form `y = f(x, state)`, together with the assumption that this state varies as the system operates.

Framed in this way, the distinction appears to introduce two different kinds of machine: one whose behaviour is fully determined by its inputs, and another whose behaviour depends on hidden, time-varying internal structure.

However, as argued in Section 2, the object of analysis here is not the machine itself, but the relation selected for reasoning. The distinction must therefore be interpreted within model space, not as a classification of physical systems.

Under this interpretation, the introduction of “state” does not denote a new kind of machine. It indicates that the relation `y = f(x)` is insufficient — that the invariant selected for reasoning omits variables on which the behaviour depends. What cybernetics describes as internal state is, in this formulation, the presence of additional arguments required by the constraint, but not included in the observer’s model.

The minimal correction is not to abandon the relational description, but to extend it. Instead of:

```text
y = f(x)
```

we admit an additional argument:

```text
y = f(x, s)
```

This remains a constraint over values — an invariant in the same sense as before — but one whose full set of arguments is no longer entirely available to the observer.

In the language of cybernetics, `s` corresponds to what is called the internal state. In the present formulation, however, it must be understood more precisely.

`s` is not “state in the system”.

It is the part of the relation required for determinacy, but unavailable within the observer’s selection. It is a variable required by the relation for reasoning to hold, but which is not directly available to the observer. It is part of the constraint, but not part of what the observer can condition on when applying it.

The appearance of “state-dependent behaviour” arises from this mismatch. The relation depends on variables that are not included in the selected invariant, and therefore cannot be controlled or held fixed within the reasoning process.

Crucially, this does not introduce a second kind of machine. The underlying system has not changed; only the completeness of the relation used to describe it.

This leads to a revised formulation:

> what cybernetics calls a “non-trivial machine” is better understood as a case in which the selected invariant is incomplete, and must be extended to include additional variables that are not directly available to the observer.

The distinction is therefore not between trivial and non-trivial systems, but between:

- relations that are fully specified over the variables available to the observer  
- and relations that depend on additional variables that remain implicit or unobserved  

In both cases, the system itself is unchanged. What changes is the degree to which the constraint used for reasoning captures the variables on which the behaviour depends.


## 4. Composition and Constraint

The introduction of extended relations does more than account for missing variables. It changes how relations can be combined.

A relation of the form `y = f(x, s)` cannot, in general, be applied in isolation. The variable `s` is not freely specifiable at each application. Its value is constrained by the context in which the relation is evaluated. As a result, successive applications of the relation are not independent.

This constraint links relations together.

```text
R₁(x, s) → y  
R₂(y, s) → z
```

Here, `s` is not “state” in a temporal sense, but a shared component of the relation. What appears as memory or history is the requirement that this coordinate be consistent across multiple applications of the constraint.

Crucially, this does not introduce a new kind of entity. Each step remains a relation of the same form described in Section 2. The difference is that these relations are no longer isolated. They are composed, and their composition is governed by constraints on shared variables.

This leads to a further refinement:

> what cybernetics describes as “non-trivial behaviour” can be understood as the composition of relations that share constrained variables.

On this view, a non-trivial structure is not a fundamentally different kind of system, but a chain of relations, linked through coordinates that cannot be freely varied at each step. The apparent complexity arises not from the introduction of new entities, but from the way these relations are connected.






## 4. Composition and Constraint

The introduction of extended relations raises a further question: how reasoning proceeds when the variables required by the invariant are not fully available to the observer.

In the case of a single invariant, reasoning operates over a fixed relation that can be applied directly. When the relation depends on additional variables that are not directly accessible, this is no longer possible. The observer cannot evaluate a single, fully specified constraint, but must instead reason over a set of admissible relations consistent with the available information.

In this sense, the introduction of `s` does not produce a single extended invariant, but a family of possible invariants, each corresponding to a different valuation of the variables that remain implicit. Reasoning proceeds by constraining this family — narrowing the set of admissible relations through the application of further conditions.

This introduces a second level of structure. The variables omitted from the observer’s model cannot be freely specified at each application of the relation. Their values must remain consistent across uses of the constraint. As a result, successive applications of the relation are no longer independent. They become linked through shared conditions on the variables that remain implicit.

This linkage gives rise to what appears, in cybernetic terms, as state dependence or process. In the present formulation, however, no additional ontology is required. Each step remains a relation. What changes is that the relations are no longer isolated. They form a structured set, connected by constraints on shared variables.

This suggests a further refinement:

> behaviour that cannot be captured by a single invariant is described not by a different kind of system, but by a set of relations connected through constraints on variables that are not directly available to the observer.

On this view, what appears as sequence, memory, or state evolution is the consequence of reasoning across a structured set of related invariants, rather than the introduction of new kinds of entities or processes.



















## 3. From Single Invariants to Extended Relations

The formulation developed above assumes that the behaviour of interest can be captured by a single invariant — a relation over a fixed set of variables. In such cases, the same input yields the same output, and reasoning can proceed entirely within that constraint.

In cybernetics, this distinction is formalised by contrasting “trivial” and “non-trivial” machines. A trivial machine is described by a relation of the form `y = f(x)`, while a non-trivial machine is described by a relation of the form `y = f(x, state)`, together with the assumption that this state varies as the system operates.

Framed in this way, the distinction appears to introduce two different kinds of machine: one whose behaviour is fully determined by its inputs, and another whose behaviour depends on hidden, time-varying internal structure.

However, as argued in Section 2, the object of analysis here is not the machine itself, but the relation selected for reasoning. The distinction must therefore be interpreted within model space, not as a classification of physical systems.

Under this interpretation, the introduction of “state” does not denote a new kind of machine. It indicates that the original relation `y = f(x)` is insufficient — that the invariant selected for reasoning omits variables on which the behaviour depends.

The failure of a single invariant does not require a different kind of machine. It indicates that the relation we have selected is incomplete. The minimal correction is to extend the relation so that it includes the variables required to stabilise the behaviour. Instead of:

```text
y = f(x)
```

we admit an additional argument:

```text
y = f(x, s)
```

This remains a constraint over values — an invariant in the same sense as before — but one whose full set of arguments is no longer entirely available to the observer.

In the language of cybernetics, `s` corresponds to what is called the internal state. In the present formulation, however, it must be understood more precisely.

`s` is not “state in the system”.

It is a variable required by the relation for reasoning to hold, but which is not directly available to the observer. It is part of the constraint, but not part of what the observer can condition on when applying it.

The appearance of “state-dependent behaviour” arises from this mismatch. The relation depends on variables that are not included in the selected invariant, and therefore cannot be controlled or held fixed within the reasoning process.

Crucially, this does not introduce a second kind of machine. The underlying system has not changed; only the completeness of the relation used to describe it. What cybernetics describes as internal state is, in this formulation, the presence of additional arguments required by the constraint, but omitted from the observer’s model.

This leads to a revised formulation:

> what cybernetics calls a “non-trivial machine” is better understood as a case in which the selected invariant is incomplete, and must be extended to include additional variables that are not directly available to the observer.

The distinction is therefore not between trivial and non-trivial systems, but between:

- relations that are fully specified over the variables available to the observer  
- and relations that depend on additional variables that remain implicit or unobserved  

In both cases, the system itself is unchanged. What changes is the degree to which the constraint used for reasoning captures the variables on which the behaviour depends.





























The problem with the distinction is that no real system is actually trivial -- triviality is something hte observer assumes by selectiong a stable relation and ignoring everything else. This is a sound basis for reasoning, 

Therefore: 

“trivial” ≠ property of the system
“trivial” = property of the selected relation




no real system is actually trivial — triviality is something the observer assumes by selecting a stable relation and ignoring everything else.
The problem with the distinction is that it does not compare two parallel kinds of thing. “Trivial” names an idealized relation treated as complete. “Non-trivial” names the case where that idealization breaks because hidden or carried variables still affect the outcome. One side is an abstraction; the other is what remains of the real process when the abstraction fails. That, I will argue, is a category error.


---

## 1. Start from how each side is *used*

Take the two cases as given:

- “trivial machine”  
- “non-trivial machine”

Now ask: *what does each let you do?*

---

## 2. First case: what you can do with “trivial”

You are told:

```text
y = f(x)
```

And you are allowed to do this:

- ignore everything except \(x\)  
- compute \(y\) directly  
- expect the same result every time  

Critically:

```text
internal details are irrelevant
```

If they mattered, the mapping wouldn’t hold.

So the structure is:

```text id="3l7z0y"
input → output
(independent of anything else)
```

---

## 3. What that implies (without naming it yet)

For this to work, one of two things must be true:

- either the system genuinely has no other relevant variables  
- or you are **treating it as if it doesn’t**

Given any real physical process, the first is false.

So what you are actually doing is:

```text id="e7i6hk"
ignoring internal variation
and assuming it does not affect the relation
```

That is already enough to say:

> this is not the full process; it is a reduced description.

---

## 4. Second case: what happens in “non-trivial”

Now look at the other case.

You are told:

- same input → different outputs  
- behavior depends on prior condition / internal configuration  

So the usable structure becomes:

```text id="j2n8rj"
y = f(x, something_else)
```

But that “something_else” is:

- not specified  
- not controllable from the input  
- not reducible to the same simple mapping  

And you cannot ignore it.

---

## 5. What that forces you to accept

Here, the internal configuration:

```text
matters to the outcome
```

So you are dealing with:

```text id="8xw4p0"
a process whose behavior depends on its embedding
```

You cannot collapse it into:

```text
input → output
```

without losing correctness.

---

## 6. Now compare the two directly

Put them side by side, without naming anything:

### Case 1

```text
input → output
works without referencing internal variation
```

### Case 2

```text
input → output fails
internal variation must be included
```

---

## 7. The only consistent interpretation

From that comparison, you are forced into this conclusion:

- Case 1 works **only because internal variation is being ignored**  
- Case 2 fails **because internal variation cannot be ignored**

So the difference is not two kinds of machines.

It is:

```text id="m0l6fd"
whether internal structure is suppressed or exposed
```

---

## 8. Now we can name it

Only *after* that reasoning do the labels become justified:

- Case 1 is an **idealized relation**  
  (internal structure suppressed)

- Case 2 is an **embedded process**  
  (internal structure active in outcomes)

---

## 9. Calling it a category error is justified

Because the original terminology suggests:

```text
two kinds of machines
```

But the analysis shows:

```text
two ways of describing behavior
```

- one that discards internal structure  
- one that cannot  

So it mixes:

```text id="zv6y6h"
description (reduced relation)
vs
process (full embedded dynamics)
```

---
































A trivial machine is described as a fixed mapping from input to output. A non-trivial machine introduces internal state, so that output depends on both input and prior configuration. Taken at face value, this suggests a distinction between two kinds of systems: one simple and stable, the other stateful and historically contingent.







1. The Problem with “Trivial” and “Non-Trivial”

The distinction between “trivial” and “non-trivial” machines, introduced in cybernetics by people like W. Ross Ashby and Heinz von Foerster, didn't sit cleanly with me. 



A “trivial machine” is usually described as one where the same input produces the same output. In practice, no physical system behaves this cleanly in an absolute sense. Any implementation depends on many factors—temperature, timing, material conditions, noise—that are typically not included in the description. When we call something “trivial,” we are already simplifying: we are choosing to ignore those additional variables because, for our purposes, they do not seem to matter.


A “non-trivial machine,” by contrast, is one where the same input can lead to different outputs due to internal state. But this difference may not indicate a fundamentally different kind of system. It may instead reflect a change in what we are attending to. Variables that were previously ignored—such as accumulated state—are now treated as relevant.

Seen this way, the distinction begins to soften. Rather than separating two kinds of machines, it may be pointing to two ways of describing behavior:

one where a relation is treated as stable and sufficient
one where additional variables are acknowledged as necessary

From this perspective, a more cautious conclusion suggests itself:

What appears “trivial” or “non-trivial” may depend less on the system itself, and more on which relations we choose to treat as stable.

When we work with a simple relation—like 
C=A+B
C=A+B—we are not claiming that the underlying physical process is that simple. We are selecting a pattern that appears reliable within some range of conditions, and reasoning as if it holds. When that assumption remains valid, the system appears trivial. When it breaks down, the system appears non-trivial.

This does not invalidate the original distinction, but it reframes it. It suggests that “triviality” is not an intrinsic property of systems, but something that emerges from how we describe them—specifically, from which variables we choose to include or ignore.

That shift—from machines to relations, from properties to descriptions—is the starting point for the rest of the argument.
