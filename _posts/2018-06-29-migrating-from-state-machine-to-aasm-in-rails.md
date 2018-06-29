---
layout: post
title: "Migrating from state_machine to aasm in Rails"
tldr:
modified: 2018-06-29 16:29:40 +0530
category: technology
tags: [State Machine, Ruby on Rails, Rails 5]
author: akash
image:
  feature:
  credit:
  creditlink:
comments:
share:
---




***First things first. State machines are awesome, be it any part of technology you use them in.***

Recently at work, we passed many pipelines on migrating a very large Rails app from Rails 4 to Rails 5. One of the major parts of this change was shifting from `state_machine` to `aasm` for our state transitions. We rely heavily on state machines for how our instances shift states. Much of our tasks associated with the models too are integrated with the after/before actions of our state machines.

![Generated using https://github.com/Katee/aasm-diagram]({{site.baseurl}}/images/aasm_migration/state_machine_diagram.png)

### Need for transition:

One and only one reason, [`state_machine`](https://github.com/pluginaweek/state_machine) has been dead, and for quite some time. We shifted from Rails 3.2 to Rails 4.2 last year, and since it was a really, really painful migration, we fixed our focus on changed syntax and `ActiveJob`, found the much famous [monkeypatch](https://github.com/pluginaweek/state_machine/issues/334#issuecomment-68168119) for Rails 4.2 and stayed happy for the time being with state_machine. Though there is [state_machines_activerecord](https://github.com/state-machines/state_machines-activerecord), we wanted to move to a more reliable and tested library, and as we already use [acts_as_state_machine](https://github.com/state-machines/state_machines-activerecord) or `aasm` in one of our other projects, we tried and gave it a shot, when we began our Rails 5 voyage, for which of course neither state_machine and its patch worked, nor it was recommended.

### What changed:

As it turned out, the process was not too messy. After a small study of the way both state_machine and aasm handle state transitions, one can easily find an analogy. Here are a few things which usually are a part of a state_machine laden project and how they should be modified to work with aasm

**1. The gem itself**

Goes without saying, remove from your `Gemfile/gems.rb` :

{% highlight ruby %}
  gem 'state_machine'
{% endhighlight %}

and add :

{% highlight ruby %}
  gem 'aasm'
{% endhighlight %}

**2. Get rid of the state_machine monkey-patch if present**

{% highlight ruby %}
  module StateMachine
    module Integrations
      module ActiveModel
        public :around_validation
      end
      module ActiveRecord
        public :around_save
        def define_state_initializer
          define_helper :instance, <<-end_eval, __FILE__, __LINE__ + 1
            def initialize(*)
              super do |*args|
                self.class.state_machines.initialize_states self
                yield(*args) if block_given?
              end
            end
          end_eval
        end
      end
    end
  end
{% endhighlight %}

Yes, get rid of this if you have it, most probably in one of your `config/initializers`.

**3. Transitioning the transitions:**

This is the major part of the change and yet the easiest to implement. This includes code change in models. Take a look at the documentation over at aasm and start changing the code. Here are a few pointers.

add `include AASM` to your model

{% highlight ruby %}
  class Question < ActiveRecord::Base
    include AASM
    ...
  end
{% endhighlight %}

specify the column name on which you are observing state transitions, for eg. if the column name is `state`

{% highlight ruby %}
  class Question < ActiveRecord::Base
    include AASM
    ...
    aasm.attribute_name :state
    ...
  end
{% endhighlight %}

Initiate your state machine block by listing out all your states. The common way is using one line to specify your initial state, and a second line to list all your non-initial states

{% highlight ruby %}
  class Question < ActiveRecord::Base
    include AASM
    ...
    aasm.attribute_name :state
    aasm do
      state :authored, initial: true
      state :piloted, :non_active, :active, :removed
      ...
    end
    ...
  end
{% endhighlight %}

Convert your events. All event blocks of the form transition `:a => :b` will be replaced by transitions `from: :a, to: :b`

{% highlight ruby %}
  class Question < ActiveRecord::Base
    include AASM
    ...

    # State machine code

    state_machine :state, initial: :authored do

      event :pilot do
        transition :authored => :piloted
      end

      event :activate do
        transition [:piloted, :non_active] => :active
      end

      ..
    end


   # AASM code

    aasm.attribute_name :state
    aasm do
      state :authored, initial: true
      state :piloted, :non_active, :active, :removed

      event :pilot do
        transitions from: :authored, to: :piloted
      end

      event :activate do
        transitions from: [:piloted, :non_active], to: :active
      end

      ...
    end
    ...
  end
{% endhighlight %}

Callbacks like `before_transition` and `after_transition` from state_machine can be converted like this:

{% highlight ruby %}
  class Question < ActiveRecord::Base
    include AASM
    ...

    # State machine code

    state_machine :state, initial: :authored do
      before_transition :authored => :piloted, :do => :prepare_cockpit
      after_transition :authored => :piloted, :do => :fly_the_plane

      event :pilot do
        transition :authored => :piloted
      end
      ...
    end

    # AASM code

    aasm.attribute_name :state
    aasm do
      state :authored, initial: true
      state :piloted, :non_active, :active, :removed

      event :pilot do
        before do
          prepare_cockpit
        end
        transitions from: :authored, to: :piloted, after: :fly_the_plane
      end

      ...
    end
    ...

    def prepare_cockpit
      ...
    end

    def fly_the_plane
      ...
    end


  end
{% endhighlight %}

However, in case of callbacks on a part of a transitions defined inside an event, one needs to define the transitions separately

{% highlight ruby %}
  class Question < ActiveRecord::Base
    include AASM
    ...

    # State machine code

    state_machine :state, initial: :authored do
      after_transition :authored => :piloted, :do => :fly

      event :pilot do
        transition [:inactive, :authored] => :piloted
      end
      ...
    end

    # AASM code

    aasm.attribute_name :state
    aasm do
      state :authored, initial: true
      state :piloted, :non_active, :active, :removed

      event :pilot do
        transitions from: :authored, to: :piloted, after: :fly
        transitions from: :inactive, to: :piloted
      end

      ...
    end
    ...

    def fly
      ...
    end

  end
{% endhighlight %}

`if` and `unless` guard blocks on transitions work the same way as in state_machine, and can also be substituted with a guard clause. The guards as well as callbacks can take arguments, `lambda` as well as `Proc`, same as the state machine guards

{% highlight ruby %}
  class Question < ActiveRecord::Base
    include AASM
    ...

    # State machine code

    state_machine :state, initial: :authored do

      event :pilot do
        transition :authored => :piloted, if: :can_fly?
      end
      ...
    end

    # AASM code

    aasm.attribute_name :state
    aasm do
      state :authored, initial: true
      state :piloted, :non_active, :active, :removed

      event :pilot do
        transitions from: :authored, to: :piloted, guard: :can_fly?
      end

      ...
    end
    ...

    def can_fly?
      ...
    end

  end
{% endhighlight %}

Yes, that’s it for the models. You can take a detailed look at the docs if you have more complex needs.

**4. The helpers:**

One plus point for `state_machine` , it has/had a variety of useful helpers for making use of states and events in views and controllers. `aasm`, though lagging behind a little in this domain, still has a good pool of helpers, both `class` and `instance` to make good use of. Here are some pointers.

  * `Question.aasm.states` will give you an object list of all states available for the `Question` model
  * `Question.aasm.events` will give you an object list of all events available for the `Question` model
  * `Question.first.aasm.states` will give an object list of all states available for transitioning to for a `Question` object, in this case the first one.
  * `Question.first.aasm.events` will give an object list of all events that can be applied on the current state of the `Question` object, i.e the first
  * All of the above helpers will produce an object list that contains name as the name of object, so appending `.map(&:name)` will give a symbol array of the name of objects, that will come handy in drop-downs. Eg.

{% highlight ruby %}
  pry(main)> Question.last.aasm.events.map(&:name)
  => [:pilot, :deactivate]
{% endhighlight %}

Another great point in favor of `state_machine` is its `state_event` attribute over the instance. For eg.

{% highlight ruby %}
  pry(main)> question = Question.first
  pry(main)> question.state_event = :deactivate
  pry(main)> question.save
{% endhighlight %}

The code above will end up saving the question after calling the `deactivate` event over it. This attribute is highly useful in rails forms where one can easily pass what event to call from, and the transition will happen without extra hassle. Unfortunately, there’s no equivalent attribute cum method in aasm . But one can always write a common `ActiveRecord::Base` helper for the same.

On another note, the not-so-good-looking `with_state` / `with_states` scope methods of `state_machine` can be replaced by the enum equivalent syntax of `aasm` . For eg.

{% highlight ruby %}
  Question.with_state(:active) # state_machine
{% endhighlight %}

gets replaced by a much cleaner :

{% highlight ruby %}
  Question.active
{% endhighlight %}

So yes, a couple of tweaks here and there, and a good pool of existing test cases which run green, you are done and production ready. This will get you started, but do back yourself up with the aasm docs.
