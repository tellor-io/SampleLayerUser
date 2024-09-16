# SampleLayerUser

The purpose of this is to show some best practices with regards on how to think about security of your data. 


Areas to think about:

    - The data is at least as old as 2 tellor blocks (1 sec each), and one block on the users chain (e.g. 12 sec for ethereum per block). 
    However as with any blockchain, the blocks can fill up and validators can select or censor certain transactions so the data is not guarunteed to be fast. 
    - All oracles can fail.  Have a go to for if this happens (a pause or fallback if compromised, a method if the oracle just pauses). 
    - data definitions - what data are you actually getting?  What are the dispute thresholds?  Are they strict or loose?
So answer in code:

    Do you take the given oracle value upon submission?  What aggregate power do you require? 
    Do you use it optimistically if consnensus not reached?  How long do you wait for disputes? Do you have a minimum power here?
    How old can the data be? (Be sure to verify that you can't dispute to go back in time)
    What happens if the oracle stops posting data?
    Can the contract be paused?  How long, what are the details?
    How can users exit your contract in the case of a pause or oracle not posting data
    Are there exits in your system w/ no oracle updates or stale oracle updates (locking users until valid updates prevents censorship)

