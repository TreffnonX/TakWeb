Tak Style Serialization

Tak Style Serialization (TSS) is a nestable tree-structured representation of
style settings for the TreffnonX-Github-Fork. It allows for the customization
of the board, the pieces and the 3D environment. A serialized string may modify
a specific aspect of game style, or define the entirety of the game style.
TSS does not affect or define interface related settings. It is expressly limited
to the objects within the 3D environment of the game.

TSS is represented as an xml-like tree structure with opening and closing tags.
However counter to xml, tags are always either wrappers or leafs values.
A value can only be stored in a leaf. Values are stored as key-value pairs in a
leaf, where the key is represented as the leaf-identifier and the value is the
value part of the leaf. Leafs cannot contain other elements.
Syntax for a wrapper is defined as follows:

<wrapper-identifier <sub-wrapper/leaf ...> <sub-wrapper-2/leaf-2 ...> ...>

Leafs are single value elements represented as follows:

<leaf-identifier: integer/float/string>

A TSS outermost element is the TSS-root, which is a wrapper and has the identifier
tss. 

While it is strictly optional to insert new lines or spaces, it is highly recommended
for readability reasons. It is also recommended to indent any inner elements, be it
wrapper or leaf, by two spaces into it's respective parent wrapper. A excerpt of a
properly layed out TSS may look like this:

<tss
  <pieces
    <models
	  <capstone
	    <name:example_capstone>
		<spline
	      <node
			<x:0.98>
			<y:0>
			<t:0>
		  >
		  <node
			<x:1>
			<y:0.02>
			<t:0.02>
		  >
		  ...
		>
	  >
	>
  >
>

All spaces and new lines are trimmed as the TSS is parsed and do not affect the outcome.
Note, that a TSS may lay out elements in the most readably way, which may not always be
the strict way. In the case of the TSS above, it might be preferrable to lay the TSS out
as follows:

<tss
  <pieces
    <models
	  <capstone
	    <name:example_capstone>
		<spline
	      <node <x:0.98> <y:0> <t:0>>
		  <node <x:1> <y:0.02> <t:0.02>>
		  ...
		>
	  >
	>
  >
>

TSS is an extensible language and may at any point be extended to encapsule new style
options. For that reason a TSS is not expected to be complete. Applying a TSS to a client
means, that all stored values are incorporated into the tree structure of the fork client's
style data structure and will modify the currently displayed style within the 3D environment.

TSS styles are interchangable between users and can be both parsed and printed in order to
exchange them.

A list of wrappers and leafs is updated as the developement advanced.

+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

TSS validation

TSS is validated on client side by comparing it to the tss-definition.def file which contains
the valid tree in a representation similar to TSS. All singular elements are represented once.
Optional elements are represented once with a '?' (questionmark) character behind the
identifier. Elements which can occure multiple times are represented once with a '*' (asterisk)
character behind the identifier. Elements which occure at least once are represented once with
a '+' (plus) character behind the identifier.
Allowed value types of leafs are defined as either 's' for string, 'i' for integer, 'f' for
float, 'i255' for integers between 0 and 255 or, or 'f1' for flaots
or integers between 0 and 1. Colors must be expressed as multiple values, preferrably as floats
by specifying hue, saturation, brightness and alpha (if required).

Standard values or instances can be defined, if a value can occure multiple times. For a wrapper
element, this is represented by an instance element which starts with a '#' (sharp) character
before the identifier. Any standard wrapper instance must be complete and healthy. Standard
instances cannot be deleted or modified by the user. However they may be copied and the copies
can be modified.

A TSS specification may look as follows:

<tss
  <pieces
    <models
	  <capstone
	    <name:s>
		<spline
		  <node+ <x:fi> <y:fi> <t:fi>>
		  <rill* <x:fi> <y:fi> <radius:f>>
		>
	  >
	  <#capstone
        <name:treffnonx_cylindric>
		<spline:
	  >
	>
  >
>